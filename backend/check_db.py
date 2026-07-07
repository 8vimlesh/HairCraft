import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import sys

async def main():
    uri = "mongodb+srv://Vercel-Admin-atlas-haircraft:Haircraft123@atlas-haircraft.45qvz3c.mongodb.net/?appName=atlas-haircraft"
    client = AsyncIOMotorClient(uri, serverSelectionTimeoutMS=5000)
    db = client["haircraft"]
    
    collections = await db.list_collection_names()
    print("Collections:", collections)
    
    if "services" in collections:
        c = await db.services.count_documents({})
        print(f"Services count: {c}")
        
    if "bookings" in collections:
        c = await db.bookings.count_documents({})
        print(f"Bookings count: {c}")
        async for doc in db.bookings.find({}):
            print("Booking:", doc)

asyncio.run(main())
