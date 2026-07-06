from fastapi import APIRouter, Depends, Query, HTTPException
from typing import List, Optional
from app.db.mongo import get_db
from app.models.schemas import ServiceSchema

router = APIRouter()

@router.get("", response_model=List[ServiceSchema])
async def get_services(
    category: Optional[str] = Query(None, description="Filter by category: male or female"),
    db = Depends(get_db)
):
    """
    Get all active services, optionally filtered by category.
    """
    query = {"active": True}
    if category:
        # Category can be male or female
        query["category"] = category.lower()
        
    cursor = db.services.find(query)
    services = []
    async for doc in cursor:
        services.append(doc)
    return services

@router.post("/seed", status_code=201)
async def seed_services(db = Depends(get_db)):
    """
    Manual seed endpoint to reset/populate default services.
    """
    # Delete existing
    await db.services.delete_many({})
    
    female_services = [
        {"name": "Hair Cut", "category": "female", "duration_minutes": 30, "price": 600.0, "active": True},
        {"name": "Hair Colour", "category": "female", "duration_minutes": 90, "price": 2500.0, "active": True},
        {"name": "Facial", "category": "female", "duration_minutes": 60, "price": 1500.0, "active": True},
        {"name": "De-Tan", "category": "female", "duration_minutes": 30, "price": 800.0, "active": True},
        {"name": "Hair Spa", "category": "female", "duration_minutes": 60, "price": 1200.0, "active": True},
        {"name": "Hair Styling", "category": "female", "duration_minutes": 45, "price": 1000.0, "active": True},
    ]
    
    male_services = [
        {"name": "Hair Cut", "category": "male", "duration_minutes": 30, "price": 300.0, "active": True},
        {"name": "Hair Trim", "category": "male", "duration_minutes": 20, "price": 150.0, "active": True},
        {"name": "Hair Styling", "category": "male", "duration_minutes": 30, "price": 400.0, "active": True},
        {"name": "Hair Colour", "category": "male", "duration_minutes": 60, "price": 1000.0, "active": True},
        {"name": "Hair Spa", "category": "male", "duration_minutes": 45, "price": 800.0, "active": True},
        {"name": "Beard Trim", "category": "male", "duration_minutes": 20, "price": 150.0, "active": True},
        {"name": "Beard Styling", "category": "male", "duration_minutes": 30, "price": 250.0, "active": True},
        {"name": "Clean Shave", "category": "male", "duration_minutes": 30, "price": 200.0, "active": True},
        {"name": "Royal Shave", "category": "male", "duration_minutes": 45, "price": 350.0, "active": True},
        {"name": "Beard Colour", "category": "male", "duration_minutes": 30, "price": 400.0, "active": True},
        {"name": "Facial", "category": "male", "duration_minutes": 60, "price": 1200.0, "active": True},
        {"name": "De-Tan", "category": "male", "duration_minutes": 30, "price": 600.0, "active": True},
        {"name": "Cleanup", "category": "male", "duration_minutes": 30, "price": 500.0, "active": True},
        {"name": "Head Massage", "category": "male", "duration_minutes": 20, "price": 250.0, "active": True},
        {"name": "Scalp Treatment", "category": "male", "duration_minutes": 45, "price": 1500.0, "active": True},
        {"name": "Anti Hair Fall Treatment", "category": "male", "duration_minutes": 60, "price": 1800.0, "active": True},
        {"name": "Dandruff Treatment", "category": "male", "duration_minutes": 45, "price": 1200.0, "active": True},
        {"name": "Keratin Treatment", "category": "male", "duration_minutes": 120, "price": 4000.0, "active": True},
        {"name": "Hair Smoothening", "category": "male", "duration_minutes": 180, "price": 5000.0, "active": True},
        {"name": "Hair Straightening", "category": "male", "duration_minutes": 150, "price": 4500.0, "active": True},
        {"name": "Manicure", "category": "male", "duration_minutes": 45, "price": 800.0, "active": True},
        {"name": "Pedicure", "category": "male", "duration_minutes": 45, "price": 900.0, "active": True},
    ]
    
    all_services = female_services + male_services
    await db.services.insert_many(all_services)
    return {"message": f"Successfully seeded {len(all_services)} services"}
