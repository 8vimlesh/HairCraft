import asyncio
import logging
from datetime import datetime, timedelta
import pytz
from bson import ObjectId
from app.db.mongo import db_holder
from app.notifications.dispatch import notification_dispatcher
from app.core.config import settings

logger = logging.getLogger("haircraft")

async def run_reminders_async():
    """
    Main async logic to check upcoming appointments and send reminders.
    """
    db = db_holder.db
    if not db:
        return
        
    tz = pytz.timezone(settings.TIMEZONE)
    now = datetime.now(tz)
    
    # 1. Fetch all bookings that are active and have unsent reminders
    query = {
        "status": {"$in": ["confirmed", "rescheduled"]},
        "$or": [
            {"reminders_sent.24h": False},
            {"reminders_sent.1h": False}
        ]
    }
    
    cursor = db.bookings.find(query)
    async for booking in cursor:
        booking_id = booking["_id"]
        customer_name = booking["customer_name"]
        mobile_number = booking["mobile_number"]
        booking_date_str = booking["date"]
        booking_time_str = booking["time_slot"]
        
        # Parse booking scheduled time
        try:
            slot_hour, slot_minute = map(int, booking_time_str.split(":"))
            scheduled_date = datetime.strptime(booking_date_str, "%Y-%m-%d").date()
            scheduled_dt = tz.localize(datetime(
                scheduled_date.year, scheduled_date.month, scheduled_date.day,
                slot_hour, slot_minute
            ))
        except Exception as e:
            logger.error(f"Failed to parse booking time for {booking_id}: {e}")
            continue
            
        time_until_booking = scheduled_dt - now
        
        # Fetch service details
        srv = await db.services.find_one({"_id": ObjectId(booking["service_id"])})
        service_name = srv.get("name", "Salon Service") if srv else "Salon Service"
        
        booking_data = {
            "_id": str(booking_id),
            "customer_name": customer_name,
            "mobile_number": mobile_number,
            "date": booking_date_str,
            "time_slot": booking_time_str,
            "service_name": service_name
        }
        
        updates = {}
        
        # Check 24-hour reminder: if booking is between 1 and 24 hours away, and 24h reminder is not sent
        if (timedelta(hours=1) < time_until_booking <= timedelta(hours=24)) and not booking.get("reminders_sent", {}).get("24h"):
            logger.info(f"Sending 24h reminder for booking {booking_id}...")
            await notification_dispatcher.dispatch_reminder(booking_data, "24 hours")
            updates["reminders_sent.24h"] = True
            
        # Check 1-hour reminder: if booking is between 0 and 1 hours away, and 1h reminder is not sent
        elif (timedelta(seconds=0) < time_until_booking <= timedelta(hours=1)) and not booking.get("reminders_sent", {}).get("1h"):
            logger.info(f"Sending 1h reminder for booking {booking_id}...")
            await notification_dispatcher.dispatch_reminder(booking_data, "1 hour")
            updates["reminders_sent.1h"] = True
            
        # Update database status if notifications were sent
        if updates:
            await db.bookings.update_one(
                {"_id": booking_id},
                {"$set": updates}
            )

def check_and_send_reminders():
    """
    Synchronous wrapper to run async reminder tasks from APScheduler threads.
    """
    try:
        # Get or create event loop for this thread
        try:
            loop = asyncio.get_event_loop()
        except RuntimeError:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            
        if loop.is_running():
            asyncio.ensure_future(run_reminders_async())
        else:
            loop.run_until_complete(run_reminders_async())
    except Exception as e:
        logger.error(f"Error in check_and_send_reminders job: {e}")
