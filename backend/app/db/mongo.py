import logging
import asyncio
from datetime import datetime
# pyrefly: ignore [missing-import]
from bson import ObjectId
from pymongo import ASCENDING
from pymongo.errors import DuplicateKeyError
from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings

logger = logging.getLogger("haircraft")

# In-Memory database storage for Mock Mode
_mock_db_store = {
    "services": [],
    "slots_config": [],
    "bookings": []
}

class MockCursor:
    def __init__(self, docs):
        self.docs = docs
        self.index = 0

    def sort(self, sort_keys, direction=None):
        # Simple sort implementation (e.g. by date and time_slot)
        # sort_keys is list of tuples: [("date", 1), ("time_slot", 1)]
        if isinstance(sort_keys, list):
            for key, order in reversed(sort_keys):
                reverse = order < 0
                self.docs.sort(key=lambda x: x.get(key, ""), reverse=reverse)
        return self

    def __aiter__(self):
        return self

    async def __anext__(self):
        if self.index < len(self.docs):
            doc = self.docs[self.index]
            self.index += 1
            return doc
        raise StopAsyncIteration


class MockCollection:
    def __init__(self, name):
        self.name = name

    def _get_docs(self):
        return _mock_db_store[self.name]

    def _match_query(self, doc, query) -> bool:
        for k, v in query.items():
            if k == "$or":
                # v is list of queries
                any_match = False
                for q in v:
                    if self._match_query(doc, q):
                        any_match = True
                        break
                if not any_match:
                    return False
            elif k == "status" and isinstance(v, dict) and "$in" in v:
                if doc.get("status") not in v["$in"]:
                    return False
            elif k == "_id" and isinstance(v, dict) and "$ne" in v:
                if doc.get("_id") == v["$ne"]:
                    return False
            elif k == "slots_reserved" and isinstance(v, dict) and "$in" in v:
                # Check list overlap
                overlap = set(doc.get("slots_reserved", [])) & set(v["$in"])
                if not overlap:
                    return False
            else:
                # Support nested dot notation
                val = doc
                for part in k.split("."):
                    if isinstance(val, dict):
                        val = val.get(part)
                    else:
                        val = None
                        break
                
                if k == "_id":
                    if str(val) != str(v):
                        return False
                else:
                    if val != v:
                        return False
        return True

    async def count_documents(self, query):
        count = 0
        for doc in self._get_docs():
            if self._match_query(doc, query):
                count += 1
        return count

    def find(self, query):
        matched = []
        for doc in self._get_docs():
            if self._match_query(doc, query):
                matched.append(doc)
        return MockCursor(matched)

    async def find_one(self, query):
        # Handle string or ObjectId lookup
        if isinstance(query, ObjectId):
            query = {"_id": query}
            
        for doc in self._get_docs():
            if self._match_query(doc, query):
                return doc
        return None

    async def insert_one(self, doc, session=None):
        # Simulate booking partial unique index
        if self.name == "bookings":
            status = doc.get("status", "confirmed")
            if status in ["confirmed", "completed", "rescheduled"]:
                # Check for overlap index collision: date + slots_reserved
                date = doc.get("date")
                slots_reserved = doc.get("slots_reserved", [])
                
                for existing in self._get_docs():
                    if (existing.get("status") in ["confirmed", "completed", "rescheduled"] and
                        existing.get("date") == date and
                        bool(set(existing.get("slots_reserved", [])) & set(slots_reserved))):
                        # Unique Index Collision!
                        raise DuplicateKeyError("Duplicate key error on index: unique_active_reserved_slots")

        if "_id" not in doc:
            doc["_id"] = ObjectId()
        self._get_docs().append(doc)
        
        # Helper class for insert response
        class InsertResult:
            inserted_id = doc["_id"]
        return InsertResult()

    async def insert_many(self, docs, session=None):
        inserted_ids = []
        for doc in docs:
            res = await self.insert_one(doc, session=session)
            inserted_ids.append(res.inserted_id)
        class InsertManyResult:
            def __init__(self, ids):
                self.inserted_ids = ids
        return InsertManyResult(inserted_ids)

    async def update_one(self, query, update, upsert=False, session=None):
        doc = await self.find_one_and_update(query, update, session=session)
        class UpdateResult:
            def __init__(self, matched, modified):
                self.matched_count = matched
                self.modified_count = modified
                self.acknowledged = True
        if doc:
            return UpdateResult(1, 1)
        elif upsert:
            set_fields = update.get("$set", {})
            new_doc = {**query}
            for k, v in set_fields.items():
                if "." in k:
                    parent, child = k.split(".")
                    if parent not in new_doc:
                        new_doc[parent] = {}
                    new_doc[parent][child] = v
                else:
                    new_doc[k] = v
            await self.insert_one(new_doc, session=session)
            return UpdateResult(0, 1)
        return UpdateResult(0, 0)

    async def find_one_and_update(self, query, update, return_document=True, session=None):
        doc = await self.find_one(query)
        if not doc:
            return None
            
        set_fields = update.get("$set", {})
        for k, v in set_fields.items():
            # Handle dot notation (e.g. reminders_sent.24h)
            if "." in k:
                parent_key, child_key = k.split(".")
                if parent_key not in doc:
                    doc[parent_key] = {}
                doc[parent_key][child_key] = v
            else:
                doc[k] = v
                
        push_fields = update.get("$push", {})
        for k, v in push_fields.items():
            if k not in doc:
                doc[k] = []
            doc[k].append(v)
            
        pull_fields = update.get("$pull", {})
        for k, v in pull_fields.items():
            if k in doc and isinstance(doc[k], list):
                doc[k] = [x for x in doc[k] if x != v]
                
        return doc

    async def find_one_and_replace(self, query, replacement, return_document=True):
        idx = -1
        docs = self._get_docs()
        for i, doc in enumerate(docs):
            if self._match_query(doc, query):
                idx = i
                break
        if idx == -1:
            return None
        
        if "_id" not in replacement:
            replacement["_id"] = docs[idx]["_id"]
        docs[idx] = replacement
        return replacement

    async def delete_many(self, query):
        docs = self._get_docs()
        keep = []
        for doc in docs:
            if not self._match_query(doc, query):
                keep.append(doc)
        _mock_db_store[self.name] = keep
        return len(docs) - len(keep)

    async def create_index(self, *args, **kwargs):
        pass


class MockDatabase:
    def __init__(self):
        self.services = MockCollection("services")
        self.slots_config = MockCollection("slots_config")
        self.bookings = MockCollection("bookings")
        self.users = MockCollection("users")

    @property
    def client(self):
        # Provide a dummy client that can start sessions
        class DummyClient:
            async def start_session(self):
                class DummySession:
                    async def __aenter__(self):
                        return self
                    async def __aexit__(self, exc_type, exc_val, exc_tb):
                        pass
                    def start_transaction(self):
                        class DummyTransaction:
                            async def __aenter__(self):
                                return self
                            async def __aexit__(self, exc_type, exc_val, exc_tb):
                                pass
                        return DummyTransaction()
                return DummySession()
        return DummyClient()


class Database:
    client = None
    db = None
    is_mock = False

db_holder = Database()

async def get_db():
    return db_holder.db

async def connect_to_mongo():
    try:
        logger.info(f"Connecting to MongoDB at {settings.MONGODB_URI}...")
        # Check connection quickly
        client = AsyncIOMotorClient(settings.MONGODB_URI, serverSelectionTimeoutMS=2000)
        # Trigger a command to test the connection
        await client[settings.DB_NAME].command("ping")
        
        db_holder.client = client
        db_holder.db = client[settings.DB_NAME]
        db_holder.is_mock = False
        logger.info("Connected successfully to real MongoDB server.")
    except Exception as e:
        logger.warning(f"Failed to connect to real MongoDB: {e}.")
        logger.warning("⚠️ Local/Remote MongoDB not detected. Falling back to IN-MEMORY MOCK DATABASE.")
        db_holder.db = MockDatabase()
        db_holder.is_mock = True
        
    await init_db()

async def close_mongo_connection():
    if db_holder.client and not db_holder.is_mock:
        db_holder.client.close()
        logger.info("MongoDB connection closed.")

async def init_db():
    database = db_holder.db
    
    # Create indexes (real DB only, safe dummy in mock)
    try:
        await database.bookings.create_index(
            [("date", ASCENDING), ("slots_reserved", ASCENDING)],
            unique=True,
            partialFilterExpression={"status": {"$in": ["confirmed", "completed", "rescheduled"]}},
            name="unique_active_reserved_slots"
        )
        await database.bookings.create_index(
            [("date", ASCENDING), ("time_slot", ASCENDING)],
            unique=True,
            partialFilterExpression={"status": {"$in": ["confirmed", "completed", "rescheduled"]}},
            name="unique_active_start_slots"
        )
    except Exception as e:
        logger.error(f"Error creating indexes: {e}")

    # Seed services
    service_count = await database.services.count_documents({})
    if service_count == 0:
        logger.info("Seeding default services...")
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
        for s in all_services:
            await database.services.insert_one(s)
        logger.info(f"Seeded {len(all_services)} services.")

    # Seed slots configuration
    config_count = await database.slots_config.count_documents({})
    if config_count == 0:
        logger.info("Seeding slots config...")
        default_config = {
            "working_hours": {
                "start": "10:00",
                "end": "22:00"
            },
            "slot_duration_minutes": 30,
            "closed_dates": [],
            "blocked_slots": []
        }
        await database.slots_config.insert_one(default_config)
        logger.info("Seeded slots config.")
