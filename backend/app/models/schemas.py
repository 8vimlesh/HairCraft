from pydantic import BaseModel, Field, BeforeValidator, ConfigDict
from typing import List, Optional, Annotated, Dict
from datetime import datetime

# Represents a MongoDB ObjectId as a string in JSON schemas
PyObjectId = Annotated[str, BeforeValidator(str)]

class ServiceSchema(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    name: str
    category: str  # male/female
    duration_minutes: int = 30
    price: float
    active: bool = True

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
    )

class WorkingHours(BaseModel):
    start: str = "10:00"  # HH:MM
    end: str = "22:00"    # HH:MM

class BlockedSlot(BaseModel):
    date: str          # YYYY-MM-DD
    time: str          # HH:MM (start of blocked slot)
    reason: Optional[str] = ""

class SlotsConfigSchema(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    working_hours: WorkingHours
    slot_duration_minutes: int = 30
    closed_dates: List[str] = Field(default_factory=list) # YYYY-MM-DD
    blocked_slots: List[BlockedSlot] = Field(default_factory=list)

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
    )

class RemindersSent(BaseModel):
    twenty_four_hour: bool = Field(alias="24h", default=False)
    one_hour: bool = Field(alias="1h", default=False)

    model_config = ConfigDict(
        populate_by_name=True
    )

class BookingSchema(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    customer_name: str
    mobile_number: str
    service_id: str
    date: str  # YYYY-MM-DD
    time_slot: str  # HH:MM (start slot)
    slots_reserved: List[str]  # e.g., ["10:00", "10:30"]
    status: str = "confirmed"  # confirmed / completed / cancelled / rescheduled / no_show
    notes: Optional[str] = ""
    created_at: datetime = Field(default_factory=datetime.utcnow)
    reminders_sent: RemindersSent = Field(default_factory=RemindersSent)
    booking_completion_time_seconds: Optional[float] = None
    
    # Forward compatibility fields
    staff_id: Optional[str] = None
    salon_id: Optional[str] = None

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
    )

# Request validation schemas
class BookingCreateRequest(BaseModel):
    customer_name: str
    mobile_number: str
    service_id: str
    date: str  # YYYY-MM-DD
    time_slot: str  # HH:MM
    notes: Optional[str] = ""
    id_token: Optional[str] = None  # Firebase OTP ID Token (or "mock-token" in mock mode)
    booking_completion_time_seconds: Optional[float] = None
    
    # Forward compatibility fields
    staff_id: Optional[str] = None
    salon_id: Optional[str] = None

class BookingRescheduleRequest(BaseModel):
    date: str  # YYYY-MM-DD
    time_slot: str  # HH:MM

class OwnerLoginRequest(BaseModel):
    id_token: str

class SlotBlockRequest(BaseModel):
    date: str
    time: str
    reason: Optional[str] = ""
