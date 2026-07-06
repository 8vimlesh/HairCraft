import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.db.mongo import connect_to_mongo, close_mongo_connection
from app.core.security import initialize_firebase
from app.api.routes import auth, services, availability, bookings, owner
from apscheduler.schedulers.background import BackgroundScheduler
from app.jobs.reminders import check_and_send_reminders

# Configure logger
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("haircraft")

# Initialize background scheduler
scheduler = BackgroundScheduler()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup actions
    logger.info("Starting Hair Craft Salon API...")
    await connect_to_mongo()
    initialize_firebase()
    
    # Start scheduler for timed reminders
    scheduler.add_job(
        check_and_send_reminders,
        "interval",
        minutes=1, # Check every minute for MVP responsiveness
        id="reminder_job",
        replace_existing=True
    )
    scheduler.start()
    logger.info("APScheduler reminder job started.")
    
    yield
    
    # Shutdown actions
    logger.info("Shutting down Hair Craft Salon API...")
    scheduler.shutdown()
    await close_mongo_connection()

app = FastAPI(
    title=settings.PROJECT_NAME,
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this to your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api", tags=["Auth"])
app.include_router(services.router, prefix="/api/services", tags=["Services"])
app.include_router(availability.router, prefix="/api/availability", tags=["Availability"])
app.include_router(bookings.router, prefix="/api/bookings", tags=["Bookings"])
app.include_router(owner.router, prefix="/api/owner", tags=["Owner"])

@app.get("/")
async def root():
    return {"message": "Welcome to Hair Craft Salon API", "status": "running"}
