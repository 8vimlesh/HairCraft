import logging
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from bson import ObjectId
from pymongo import ReturnDocument
from app.db.mongo import get_db
from app.models.schemas import ServiceSchema, SlotsConfigSchema, BlockedSlot, SlotBlockRequest
from app.core.security import verify_owner

router = APIRouter()
logger = logging.getLogger("haircraft")

# ----------------- BOOKING MANAGEMENT -----------------

@router.get("/bookings")
async def get_all_bookings(
    token_payload: dict = Depends(verify_owner),
    db = Depends(get_db)
):
    """Get all bookings in the salon, sorted by date and start slot."""
    cursor = db.bookings.find({}).sort([("date", 1), ("time_slot", 1)])
    bookings = []
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        bookings.append(doc)
    return bookings

@router.put("/bookings/{booking_id}/status")
async def update_booking_status(
    booking_id: str,
    req_body: dict, # {"status": "confirmed" / "completed" / "cancelled"}
    token_payload: dict = Depends(verify_owner),
    db = Depends(get_db)
):
    """Allows the owner to confirm, cancel, or complete any booking."""
    new_status = req_body.get("status")
    if new_status not in ["confirmed", "completed", "cancelled", "rescheduled", "no_show"]:
        raise HTTPException(status_code=400, detail="Invalid status option")
        
    try:
        oid = ObjectId(booking_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid booking ID format")
        
    booking = await db.bookings.find_one({"_id": oid})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
        
    result = await db.bookings.find_one_and_update(
        {"_id": oid},
        {"$set": {"status": new_status}},
        return_document=ReturnDocument.AFTER
    )
    result["_id"] = str(result["_id"])
    return result


@router.get("/analytics")
async def get_analytics(
    token_payload: dict = Depends(verify_owner),
    db = Depends(get_db)
):
    """Calculate and return key business metrics and no-show rate analytics."""
    bookings_cursor = db.bookings.find({})
    
    total = 0
    completed = 0
    cancelled = 0
    no_show = 0
    completion_times = []
    revenue = 0.0
    
    # Load services for price calculation and category analysis
    services_cursor = db.services.find({})
    services_map = {}
    async for s in services_cursor:
        services_map[str(s["_id"])] = s
        
    category_split = {"male": 0, "female": 0}
    
    async for booking in bookings_cursor:
        total += 1
        status = booking.get("status")
        
        # Track counts
        if status == "completed":
            completed += 1
        elif status == "cancelled":
            cancelled += 1
        elif status == "no_show":
            no_show += 1
            
        # Track category splits & revenue
        srv_id = booking.get("service_id")
        if srv_id in services_map:
            srv = services_map[srv_id]
            cat = srv.get("category", "male")
            if cat in category_split:
                category_split[cat] += 1
            if status == "completed":
                revenue += srv.get("price", 0.0)
                
        # Track completion times
        t = booking.get("booking_completion_time_seconds")
        if t is not None:
            completion_times.append(t)
            
    avg_completion = sum(completion_times) / len(completion_times) if completion_times else 0
    
    # Calculate no-show rate based on finalised/non-pending appointments
    finalised_count = completed + no_show + cancelled
    no_show_rate = (no_show / finalised_count) * 100 if finalised_count > 0 else 0
    
    return {
        "total_bookings": total,
        "completed_bookings": completed,
        "cancelled_bookings": cancelled,
        "no_shows": no_show,
        "no_show_rate": round(no_show_rate, 2),
        "average_completion_time_seconds": round(avg_completion, 1),
        "total_revenue": revenue,
        "category_split": category_split
    }


# ----------------- SERVICE CRUD -----------------

@router.get("/services", response_model=List[ServiceSchema])
async def get_all_services(
    token_payload: dict = Depends(verify_owner),
    db = Depends(get_db)
):
    """List all services (active and inactive)."""
    cursor = db.services.find({})
    services = []
    async for doc in cursor:
        services.append(doc)
    return services

@router.post("/services", response_model=ServiceSchema, status_code=201)
async def create_service(
    service: ServiceSchema,
    token_payload: dict = Depends(verify_owner),
    db = Depends(get_db)
):
    """Add a new salon service."""
    service_dict = service.model_dump(by_alias=True)
    if "_id" in service_dict:
        del service_dict["_id"]
        
    result = await db.services.insert_one(service_dict)
    service_dict["_id"] = result.inserted_id
    return service_dict

@router.put("/services/{service_id}", response_model=ServiceSchema)
async def update_service(
    service_id: str,
    service_update: ServiceSchema,
    token_payload: dict = Depends(verify_owner),
    db = Depends(get_db)
):
    """Edit service parameters (price, duration, active status)."""
    try:
        oid = ObjectId(service_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid service ID format")
        
    update_dict = service_update.model_dump(by_alias=True)
    if "_id" in update_dict:
        del update_dict["_id"]
        
    result = await db.services.find_one_and_replace(
        {"_id": oid},
        update_dict,
        return_document=ReturnDocument.AFTER
    )
    if not result:
        raise HTTPException(status_code=404, detail="Service not found")
    return result

@router.delete("/services/{service_id}")
async def deactivate_service(
    service_id: str,
    token_payload: dict = Depends(verify_owner),
    db = Depends(get_db)
):
    """Soft delete/deactivate a service."""
    try:
        oid = ObjectId(service_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid service ID format")
        
    result = await db.services.find_one_and_update(
        {"_id": oid},
        {"$set": {"active": False}},
        return_document=ReturnDocument.AFTER
    )
    if not result:
        raise HTTPException(status_code=404, detail="Service not found")
    return {"message": "Service deactivated successfully"}


# ----------------- SALON SLOTS CONFIG -----------------

@router.get("/config", response_model=SlotsConfigSchema)
async def get_slots_config(
    token_payload: dict = Depends(verify_owner),
    db = Depends(get_db)
):
    """Retrieve slot sizes, open/close hours, closed dates, and manual blocks."""
    config = await db.slots_config.find_one({})
    if not config:
        raise HTTPException(status_code=404, detail="Configuration not seeded")
    return config

@router.put("/config", response_model=SlotsConfigSchema)
async def update_slots_config(
    updated_config: SlotsConfigSchema,
    token_payload: dict = Depends(verify_owner),
    db = Depends(get_db)
):
    """Update salon working configurations."""
    config_dict = updated_config.model_dump(by_alias=True)
    if "_id" in config_dict:
        del config_dict["_id"]
        
    result = await db.slots_config.find_one_and_replace(
        {},
        config_dict,
        return_document=ReturnDocument.AFTER
    )
    return result

@router.post("/config/block", response_model=SlotsConfigSchema)
async def add_blocked_slot(
    block: SlotBlockRequest,
    token_payload: dict = Depends(verify_owner),
    db = Depends(get_db)
):
    """Manually block a time slot (breaks, holidays, meetings)."""
    block_dict = block.model_dump()
    
    result = await db.slots_config.find_one_and_update(
        {},
        {"$push": {"blocked_slots": block_dict}},
        return_document=ReturnDocument.AFTER
    )
    return result

@router.delete("/config/block", response_model=SlotsConfigSchema)
async def remove_blocked_slot(
    block: SlotBlockRequest,
    token_payload: dict = Depends(verify_owner),
    db = Depends(get_db)
):
    """Unblock a manually blocked slot."""
    block_dict = block.model_dump()
    
    result = await db.slots_config.find_one_and_update(
        {},
        {"$pull": {"blocked_slots": block_dict}},
        return_document=ReturnDocument.AFTER
    )
    return result
