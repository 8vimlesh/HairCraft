import logging
from datetime import datetime
from typing import List
import pytz
from fastapi import APIRouter, Depends, HTTPException, status
from bson import ObjectId
from pymongo import ReturnDocument
from pymongo.errors import DuplicateKeyError, PyMongoError
from app.db.mongo import get_db
from app.models.schemas import BookingSchema, BookingCreateRequest, BookingRescheduleRequest
from app.core.security import verify_token, verify_owner
from app.core.config import settings
from app.api.routes.availability import time_to_minutes, minutes_to_time
from app.notifications.dispatch import notification_dispatcher

router = APIRouter()
logger = logging.getLogger("haircraft")

def get_tz_now():
    return datetime.now(pytz.timezone(settings.TIMEZONE))

async def calculate_slots_needed(service_id: str, time_slot: str, db) -> List[str]:
    """Helper to calculate which consecutive 30m slots a service needs."""
    service = await db.services.find_one({"_id": ObjectId(service_id)})
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
        
    duration = service.get("duration_minutes", 30)
    
    config = await db.slots_config.find_one({})
    slot_duration = config.get("slot_duration_minutes", 30) if config else 30
    working_hours = config.get("working_hours", {"start": "10:00", "end": "22:00"}) if config else {"start": "10:00", "end": "22:00"}
    
    slots_needed = (duration + slot_duration - 1) // slot_duration
    start_mins = time_to_minutes(time_slot)
    
    slots_reserved = []
    for i in range(slots_needed):
        check_mins = start_mins + (i * slot_duration)
        slots_reserved.append(minutes_to_time(check_mins))
        
    # Check if last slot goes past working hours
    end_mins = time_to_minutes(working_hours["end"])
    if start_mins + (slots_needed * slot_duration) > end_mins:
        raise HTTPException(status_code=400, detail="Service duration extends beyond salon closing hours")
        
    return slots_reserved

async def check_availability_raw(date: str, slots_reserved: List[str], db, booking_id_to_exclude: str = None):
    """Checks if slots are free. Raises HTTPException if not."""
    # 1. Closed days
    config = await db.slots_config.find_one({})
    if config:
        if date in config.get("closed_dates", []):
            raise HTTPException(status_code=400, detail="Salon is closed on this date")
            
        # 2. Blocked slots
        blocked_slots = config.get("blocked_slots", [])
        for block in blocked_slots:
            if block.get("date") == date and block.get("time") in slots_reserved:
                raise HTTPException(status_code=400, detail=f"Slot starting at {block.get('time')} is blocked: {block.get('reason')}")

    # 3. Active Bookings overlaps
    query = {
        "date": date,
        "status": {"$in": ["confirmed", "completed", "rescheduled"]},
        "slots_reserved": {"$in": slots_reserved}
    }
    if booking_id_to_exclude:
        query["_id"] = {"$ne": ObjectId(booking_id_to_exclude)}
        
    overlapping_booking = await db.bookings.find_one(query)
    if overlapping_booking:
        raise HTTPException(
            status_code=409, 
            detail="One or more of the requested slots are already booked. Please select another time."
        )

@router.post("", response_model=BookingSchema, status_code=201)
async def create_booking(
    request: BookingCreateRequest,
    token_payload: dict = Depends(verify_token),
    db = Depends(get_db)
):
    """
    Create a new booking.
    Verifies phone OTP token, checks slot availability, and creates booking atomically.
    """
    # 1. Verify phone ownership
    auth_phone = token_payload.get("phone_number")
    if auth_phone != request.mobile_number:
        raise HTTPException(
            status_code=400,
            detail=f"Authenticated phone ({auth_phone}) does not match booking number ({request.mobile_number})"
        )

    # 2. Calculate consecutive slots needed
    slots_reserved = await calculate_slots_needed(request.service_id, request.time_slot, db)

    # 3. Formulate the booking doc
    booking_doc = {
        "customer_name": request.customer_name,
        "mobile_number": request.mobile_number,
        "service_id": request.service_id,
        "date": request.date,
        "time_slot": request.time_slot,
        "slots_reserved": slots_reserved,
        "status": "confirmed",
        "notes": request.notes,
        "created_at": datetime.utcnow(),
        "reminders_sent": {"24h": False, "1h": False},
        "booking_completion_time_seconds": request.booking_completion_time_seconds,
        "staff_id": request.staff_id,
        "salon_id": request.salon_id
    }

    # 4. Perform check and write
    # We attempt to wrap in a transaction if MongoDB cluster supports it.
    # Standalone installations will fall back to standard write (the unique partial index handles safety)
    try:
        async with await db.client.start_session() as session:
            async with session.start_transaction():
                # Perform read check within transaction
                await check_availability_raw(request.date, slots_reserved, db)
                result = await db.bookings.insert_one(booking_doc, session=session)
                booking_doc["_id"] = result.inserted_id
    except PyMongoError as err:
        # Check if transaction or replication error
        # If transaction is not supported, do non-transactional write (unique index still protects us)
        if "Transaction numbers are only allowed" in str(err) or "not a replica set" in str(err):
            logger.warning("MongoDB Transactions not supported by host. Falling back to Atomic Unique Index protection.")
            # Double check availability before write
            await check_availability_raw(request.date, slots_reserved, db)
            try:
                result = await db.bookings.insert_one(booking_doc)
                booking_doc["_id"] = result.inserted_id
            except DuplicateKeyError:
                raise HTTPException(
                    status_code=409,
                    detail="This slot was booked concurrently. Please choose a different time."
                )
        else:
            # Duplicate key error inside transaction
            if isinstance(err, DuplicateKeyError) or "duplicate key" in str(err):
                raise HTTPException(
                    status_code=409,
                    detail="This slot was booked concurrently. Please choose a different time."
                )
            logger.error(f"MongoDB error during booking: {err}")
            raise HTTPException(status_code=500, detail="Database write failure")
    
    # 5. Fetch service name for notification
    srv = await db.services.find_one({"_id": ObjectId(request.service_id)})
    service_name = srv.get("name", "Salon Service") if srv else "Salon Service"
    
    # Send instant confirmation
    await notification_dispatcher.dispatch_booking_confirmed({
        "_id": str(booking_doc["_id"]),
        "customer_name": request.customer_name,
        "mobile_number": request.mobile_number,
        "date": request.date,
        "time_slot": request.time_slot,
        "service_name": service_name
    })

    return booking_doc

@router.put("/{booking_id}/cancel", response_model=BookingSchema)
async def cancel_booking(
    booking_id: str,
    token_payload: dict = Depends(verify_token),
    db = Depends(get_db)
):
    """
    Cancel an appointment. Customers can cancel their own bookings; Owner can cancel any booking.
    Frees up slots instantly.
    """
    try:
        oid = ObjectId(booking_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid booking ID format")
        
    booking = await db.bookings.find_one({"_id": oid})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
        
    # Check permissions (Owner or the customer who owns the booking)
    auth_phone = token_payload.get("phone_number")
    is_owner = auth_phone == settings.OWNER_PHONE_NUMBER
    if not is_owner and booking.get("mobile_number") != auth_phone:
        raise HTTPException(
            status_code=403,
            detail="You do not have permission to cancel this booking"
        )
        
    if booking.get("status") == "cancelled":
        return booking

    result = await db.bookings.find_one_and_update(
        {"_id": oid},
        {"$set": {"status": "cancelled"}},
        return_document=ReturnDocument.AFTER
    )
    
    # Fetch service details for notification
    srv = await db.services.find_one({"_id": ObjectId(booking.get("service_id"))})
    service_name = srv.get("name", "Salon Service") if srv else "Salon Service"
    
    # Trigger cancellation notification
    await notification_dispatcher.dispatch_booking_cancelled({
        "_id": booking_id,
        "customer_name": booking.get("customer_name"),
        "mobile_number": booking.get("mobile_number"),
        "date": booking.get("date"),
        "time_slot": booking.get("time_slot"),
        "service_name": service_name
    })
    
    return result

@router.post("/{booking_id}/reschedule", response_model=BookingSchema)
async def reschedule_booking(
    booking_id: str,
    req: BookingRescheduleRequest,
    token_payload: dict = Depends(verify_token),
    db = Depends(get_db)
):
    """
    Reschedule an existing booking. Frees up old slots and reserves new ones.
    """
    try:
        oid = ObjectId(booking_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid booking ID format")
        
    booking = await db.bookings.find_one({"_id": oid})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
        
    auth_phone = token_payload.get("phone_number")
    is_owner = auth_phone == settings.OWNER_PHONE_NUMBER
    if not is_owner and booking.get("mobile_number") != auth_phone:
        raise HTTPException(
            status_code=403,
            detail="You do not have permission to reschedule this booking"
        )
        
    # Calculate new slots needed
    new_slots_reserved = await calculate_slots_needed(booking.get("service_id"), req.time_slot, db)
    
    # Check availability of new slots (excluding the current booking so we don't collide with ourselves)
    try:
        async with await db.client.start_session() as session:
            async with session.start_transaction():
                await check_availability_raw(req.date, new_slots_reserved, db, booking_id_to_exclude=booking_id)
                result = await db.bookings.find_one_and_update(
                    {"_id": oid},
                    {
                        "$set": {
                            "date": req.date,
                            "time_slot": req.time_slot,
                            "slots_reserved": new_slots_reserved,
                            "status": "rescheduled"
                        }
                    },
                    return_document=ReturnDocument.AFTER,
                    session=session
                )
    except PyMongoError as err:
        if "Transaction numbers are only allowed" in str(err) or "not a replica set" in str(err):
            # Standalone fallback
            await check_availability_raw(req.date, new_slots_reserved, db, booking_id_to_exclude=booking_id)
            try:
                result = await db.bookings.find_one_and_update(
                    {"_id": oid},
                    {
                        "$set": {
                            "date": req.date,
                            "time_slot": req.time_slot,
                            "slots_reserved": new_slots_reserved,
                            "status": "rescheduled"
                        }
                    },
                    return_document=ReturnDocument.AFTER
                )
            except DuplicateKeyError:
                raise HTTPException(
                    status_code=409,
                    detail="The new time slot has just been booked. Please select another time."
                )
        else:
            if isinstance(err, DuplicateKeyError) or "duplicate key" in str(err):
                raise HTTPException(
                    status_code=409,
                    detail="The new time slot has just been booked. Please select another time."
                )
            logger.error(f"Error rescheduling booking: {err}")
            raise HTTPException(status_code=500, detail="Reschedule write failure")
            
    # Fetch service details for notification
    srv = await db.services.find_one({"_id": ObjectId(booking.get("service_id"))})
    service_name = srv.get("name", "Salon Service") if srv else "Salon Service"
    
    # Dispatch reschedule notification
    await notification_dispatcher.dispatch_booking_rescheduled({
        "_id": booking_id,
        "customer_name": booking.get("customer_name"),
        "mobile_number": booking.get("mobile_number"),
        "date": req.date,
        "time_slot": req.time_slot,
        "service_name": service_name,
        "old_date": booking.get("date"),
        "old_time_slot": booking.get("time_slot")
    })
    
    return result
