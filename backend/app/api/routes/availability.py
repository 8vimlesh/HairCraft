import logging
from datetime import datetime, date as date_type
import pytz
from fastapi import APIRouter, Depends, Query, HTTPException
from bson import ObjectId
from app.db.mongo import get_db
from app.core.config import settings

router = APIRouter()
logger = logging.getLogger("haircraft")

def time_to_minutes(t_str: str) -> int:
    """Convert HH:MM to minutes from midnight."""
    h, m = map(int, t_str.split(":"))
    return h * 60 + m

def minutes_to_time(mins: int) -> str:
    """Convert minutes from midnight to HH:MM."""
    h = mins // 60
    m = mins % 60
    return f"{h:02d}:{m:02d}"

@router.get("")
async def get_availability(
    date: str = Query(..., description="Target date in YYYY-MM-DD format"),
    service_id: str = Query(..., description="ID of the service to book"),
    db = Depends(get_db)
):
    """
    Get available start slots for a specific date and service.
    Takes into account working hours, closed days, blocked slots, and existing bookings.
    """
    # 1. Validate date format
    try:
        target_date = datetime.strptime(date, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD.")
        
    # 2. Get the service
    try:
        service = await db.services.find_one({"_id": ObjectId(service_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid service_id format.")
        
    if not service or not service.get("active", True):
        raise HTTPException(status_code=404, detail="Service not found or inactive.")
        
    service_duration = service.get("duration_minutes", 30)
    
    # 3. Get salon slots configuration
    config = await db.slots_config.find_one({})
    if not config:
        # Fallback to default
        working_hours = {"start": "10:00", "end": "22:00"}
        slot_duration = 30
        closed_dates = []
        blocked_slots = []
    else:
        working_hours = config.get("working_hours", {"start": "10:00", "end": "22:00"})
        slot_duration = config.get("slot_duration_minutes", 30)
        closed_dates = config.get("closed_dates", [])
        blocked_slots = config.get("blocked_slots", [])
        
    # 4. Check if date is a closed date
    if date in closed_dates:
        return []
        
    # 5. Fetch all active bookings for this date to find reserved slots
    # Active status = anything except "cancelled"
    active_bookings_cursor = db.bookings.find({
        "date": date,
        "status": {"$in": ["confirmed", "completed", "rescheduled"]}
    })
    
    reserved_slots = set()
    async for booking in active_bookings_cursor:
        for slot in booking.get("slots_reserved", []):
            reserved_slots.add(slot)
            
    # 6. Fetch owner-blocked slots for this date
    blocked_slots_set = set()
    for block in blocked_slots:
        if block.get("date") == date:
            blocked_slots_set.add(block.get("time"))
            
    # 7. Generate candidate slots
    start_mins = time_to_minutes(working_hours["start"])
    end_mins = time_to_minutes(working_hours["end"])
    
    # How many consecutive slots does this service need?
    slots_needed = (service_duration + slot_duration - 1) // slot_duration # round up
    
    # Get current time in salon timezone to filter past slots for today
    tz = pytz.timezone(settings.TIMEZONE)
    now_in_salon = datetime.now(tz)
    today_str = now_in_salon.strftime("%Y-%m-%d")
    
    available_start_slots = []
    
    # Loop over all potential start slots
    current_mins = start_mins
    while current_mins + (slots_needed * slot_duration) <= end_mins:
        slot_time_str = minutes_to_time(current_mins)
        
        # Check if this slot and all required consecutive slots are free
        is_available = True
        needed_slots_list = []
        
        for i in range(slots_needed):
            check_mins = current_mins + (i * slot_duration)
            check_time_str = minutes_to_time(check_mins)
            needed_slots_list.append(check_time_str)
            
            # If slot is already reserved or blocked, it's unavailable
            if check_time_str in reserved_slots or check_time_str in blocked_slots_set:
                is_available = False
                break
                
        # If it's today, make sure the start slot is in the future (plus a 15-minute booking buffer)
        if is_available and date == today_str:
            slot_hour, slot_minute = map(int, slot_time_str.split(":"))
            slot_datetime = tz.localize(datetime(
                target_date.year, target_date.month, target_date.day, 
                slot_hour, slot_minute
            ))
            # 15 minutes buffer
            if slot_datetime.timestamp() < now_in_salon.timestamp() + 900:
                is_available = False
                
        if is_available:
            available_start_slots.append({
                "time": slot_time_str,
                "slots_reserved": needed_slots_list
            })
            
        current_mins += slot_duration
        
    return available_start_slots
