from fastapi import FastAPI, APIRouter
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from routers.auth import create_auth_router
from routers.family import create_family_router
from routers.screen_time import create_screen_time_router
from routers.rewards import create_rewards_router


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI(title="Screen Time Parental Control API")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Create auth router and get the dependency
auth_router = create_auth_router(db)
get_current_user = auth_router.get_current_user

# Create other routers with the auth dependency
family_router = create_family_router(db, get_current_user)
screen_time_router = create_screen_time_router(db, get_current_user)
rewards_router = create_rewards_router(db, get_current_user)

# Health check endpoint
@api_router.get("/")
async def root():
    return {"message": "Screen Time API is running", "status": "healthy"}

# Include all routers
api_router.include_router(auth_router)
api_router.include_router(family_router)
api_router.include_router(screen_time_router)
api_router.include_router(rewards_router)

# Include the main API router in the app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
