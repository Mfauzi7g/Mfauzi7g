from fastapi import FastAPI, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import socketio
import os
import logging
from pathlib import Path
from routers.auth import create_auth_router
from routers.family import create_family_router
from routers.screen_time import create_screen_time_router
from routers.rewards import create_rewards_router
from routers.device_control import create_device_control_router
from routers.chat import create_chat_router
from routers.family_sharing import create_family_sharing_router
from routers.social_auth import create_social_auth_router
from dotenv import load_dotenv

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app
app = FastAPI(title="Screen Time Parental Control API with Device Control")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Create auth router and get the dependency
auth_router = create_auth_router(db)
get_current_user = auth_router.get_current_user

# Create other routers with the auth dependency
family_router = create_family_router(db, get_current_user)
screen_time_router = create_screen_time_router(db, get_current_user)
rewards_router = create_rewards_router(db, get_current_user)
device_control_router = create_device_control_router(db, get_current_user)
chat_router = create_chat_router(db, get_current_user, device_control_router.device_manager)
family_sharing_router = create_family_sharing_router(db, get_current_user)
social_auth_router = create_social_auth_router(db, get_current_user)

# Health check endpoint
@api_router.get("/")
async def root():
    return {
        "message": "Screen Time API with Device Control is running", 
        "status": "healthy",
        "features": [
            "Authentication",
            "Family Management", 
            "Screen Time Tracking",
            "Rewards System",
            "Real-time Device Control",
            "WebSocket Communication"
        ]
    }

# Include all routers
api_router.include_router(auth_router)
api_router.include_router(family_router)
api_router.include_router(screen_time_router)
api_router.include_router(rewards_router)
api_router.include_router(device_control_router)
api_router.include_router(chat_router)
api_router.include_router(family_sharing_router)
api_router.include_router(social_auth_router)

# Include the main API router in the app
app.include_router(api_router)

# CORS middleware - must be added before WebSocket integration
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
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

# WebSocket integration for real-time device communication
sio = device_control_router.sio
# Create Socket.IO ASGI app and mount it on the FastAPI app
socket_app = socketio.ASGIApp(sio)
app.mount("/socket.io", socket_app)
