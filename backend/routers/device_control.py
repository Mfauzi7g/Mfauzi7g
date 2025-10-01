from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from datetime import datetime, timedelta
from typing import List, Optional, Dict
import uuid
import socketio
import os
from enum import Enum

class DeviceStatus(str, Enum):
    online = "online"
    offline = "offline"
    restricted = "restricted"

class DevicePlatform(str, Enum):
    ios = "ios"
    android = "android"

class Device(BaseModel):
    id: str
    child_id: str
    device_name: str
    platform: DevicePlatform
    device_identifier: str  # UDID for iOS, Android ID for Android
    status: DeviceStatus
    last_seen: datetime
    app_version: str
    paired_at: datetime

class DeviceRegister(BaseModel):
    pairing_code: str
    device_name: str
    platform: DevicePlatform
    device_identifier: str
    app_version: str

class AppLimit(BaseModel):
    app_name: str
    bundle_id: str  # iOS bundle ID or Android package name
    daily_limit_minutes: int
    category: str

class DowntimeSchedule(BaseModel):
    day_of_week: int  # 0=Sunday, 6=Saturday
    start_hour: int
    start_minute: int
    end_hour: int
    end_minute: int
    enabled: bool

class DeviceControl(BaseModel):
    command: str  # "set_app_limit", "enforce_downtime", "unlock_device", etc.
    parameters: Dict
    immediate: bool = True

class PairingCode(BaseModel):
    code: str
    child_id: str
    expires_at: datetime
    used: bool = False

# WebSocket manager for real-time device communication
class DeviceManager:
    def __init__(self):
        self.connected_devices = {}  # device_id -> socket_id
        self.sio = socketio.AsyncServer(
            cors_allowed_origins="*",
            async_mode="asgi"
        )
        self.setup_socket_handlers()
    
    def setup_socket_handlers(self):
        @self.sio.event
        async def connect(sid, environ):
            print(f"Device connected: {sid}")
        
        @self.sio.event
        async def disconnect(sid):
            # Remove device from connected list
            device_to_remove = None
            for device_id, socket_id in self.connected_devices.items():
                if socket_id == sid:
                    device_to_remove = device_id
                    break
            
            if device_to_remove:
                del self.connected_devices[device_to_remove]
                print(f"Device disconnected: {device_to_remove}")
        
        @self.sio.event
        async def device_register(sid, data):
            device_id = data.get('device_id')
            if device_id:
                self.connected_devices[device_id] = sid
                await self.sio.emit('registration_confirmed', {'status': 'success'}, room=sid)
        
        @self.sio.event
        async def command_executed(sid, data):
            print(f"Command executed on device: {data}")
            # Log command execution in database
    
    async def send_command_to_device(self, device_id: str, command: DeviceControl):
        """Send command to specific device"""
        if device_id in self.connected_devices:
            socket_id = self.connected_devices[device_id]
            await self.sio.emit('execute_command', {
                'command': command.command,
                'parameters': command.parameters,
                'timestamp': datetime.utcnow().isoformat()
            }, room=socket_id)
            return True
        return False
    
    async def broadcast_to_child_devices(self, child_id: str, command: DeviceControl, db):
        """Send command to all devices belonging to a child"""
        devices = await db.devices.find({"child_id": ObjectId(child_id)}).to_list(100)
        sent_count = 0
        
        for device in devices:
            device_id = str(device["_id"])
            if await self.send_command_to_device(device_id, command):
                sent_count += 1
                # Update device status
                await db.devices.update_one(
                    {"_id": ObjectId(device_id)},
                    {"$set": {"last_command": command.dict(), "last_command_at": datetime.utcnow()}}
                )
        
        return sent_count

# Initialize device manager
device_manager = DeviceManager()

def create_device_control_router(db: AsyncIOMotorDatabase, get_current_user):
    router = APIRouter(prefix="/device-control", tags=["device-control"])
    
    async def verify_child_ownership(child_id: str, current_user: dict):
        """Verify child belongs to current user"""
        child = await db.children.find_one({
            "_id": ObjectId(child_id),
            "user_id": ObjectId(current_user["_id"])
        })
        if not child:
            raise HTTPException(status_code=404, detail="Child not found")
        return child
    
    @router.post("/pairing-code/{child_id}")
    async def generate_pairing_code(child_id: str, current_user: dict = Depends(get_current_user)):
        """Generate a pairing code for child's device"""
        child = await verify_child_ownership(child_id, current_user)
        
        # Generate 6-digit pairing code
        code = str(uuid.uuid4())[:6].upper()
        
        pairing_data = {
            "code": code,
            "child_id": ObjectId(child_id),
            "expires_at": datetime.utcnow().replace(microsecond=0) + timedelta(minutes=15),  # 15 min expiry
            "used": False,
            "created_at": datetime.utcnow()
        }
        
        await db.pairing_codes.insert_one(pairing_data)
        
        return {
            "code": code,
            "child_name": child["name"],
            "expires_in_minutes": 15
        }
    
    @router.post("/pair-device")
    async def pair_device(device_data: DeviceRegister):
        """Pair a child's device using pairing code"""
        # Find valid pairing code
        pairing_code = await db.pairing_codes.find_one({
            "code": device_data.pairing_code,
            "used": False,
            "expires_at": {"$gt": datetime.utcnow()}
        })
        
        if not pairing_code:
            raise HTTPException(status_code=400, detail="Invalid or expired pairing code")
        
        # Check if device already exists
        existing_device = await db.devices.find_one({
            "device_identifier": device_data.device_identifier
        })
        
        if existing_device:
            raise HTTPException(status_code=400, detail="Device already paired")
        
        # Create new device
        device = {
            "child_id": pairing_code["child_id"],
            "device_name": device_data.device_name,
            "platform": device_data.platform,
            "device_identifier": device_data.device_identifier,
            "status": "online",
            "last_seen": datetime.utcnow(),
            "app_version": device_data.app_version,
            "paired_at": datetime.utcnow()
        }
        
        result = await db.devices.insert_one(device)
        
        # Mark pairing code as used
        await db.pairing_codes.update_one(
            {"_id": pairing_code["_id"]},
            {"$set": {"used": True}}
        )
        
        return {
            "device_id": str(result.inserted_id),
            "status": "paired_successfully",
            "child_id": str(pairing_code["child_id"])
        }
    
    @router.get("/devices/{child_id}", response_model=List[Device])
    async def get_child_devices(child_id: str, current_user: dict = Depends(get_current_user)):
        """Get all devices for a child"""
        child = await verify_child_ownership(child_id, current_user)
        
        devices = await db.devices.find({"child_id": ObjectId(child_id)}).to_list(100)
        
        return [Device(
            id=str(device["_id"]),
            child_id=str(device["child_id"]),
            device_name=device["device_name"],
            platform=device["platform"],
            device_identifier=device["device_identifier"],
            status=device["status"],
            last_seen=device["last_seen"],
            app_version=device["app_version"],
            paired_at=device["paired_at"]
        ) for device in devices]
    
    @router.post("/set-app-limits/{child_id}")
    async def set_app_limits(child_id: str, limits: List[AppLimit], current_user: dict = Depends(get_current_user)):
        """Set app limits for child's devices"""
        child = await verify_child_ownership(child_id, current_user)
        
        # Send command to all child's devices
        command = DeviceControl(
            command="set_app_limits",
            parameters={"limits": [limit.dict() for limit in limits]}
        )
        
        devices_updated = await device_manager.broadcast_to_child_devices(child_id, command, db)
        
        # Also save to database for persistence
        for limit in limits:
            await db.app_limits.update_one(
                {"child_id": ObjectId(child_id), "app_name": limit.app_name},
                {"$set": {
                    "bundle_id": limit.bundle_id,
                    "daily_limit_minutes": limit.daily_limit_minutes,
                    "category": limit.category,
                    "updated_at": datetime.utcnow()
                }},
                upsert=True
            )
        
        return {
            "status": "limits_set",
            "devices_updated": devices_updated,
            "limits_count": len(limits)
        }
    
    @router.post("/set-downtime/{child_id}")
    async def set_downtime_schedule(child_id: str, schedules: List[DowntimeSchedule], current_user: dict = Depends(get_current_user)):
        """Set downtime schedule for child's devices"""
        child = await verify_child_ownership(child_id, current_user)
        
        command = DeviceControl(
            command="set_downtime",
            parameters={"schedules": [schedule.dict() for schedule in schedules]}
        )
        
        devices_updated = await device_manager.broadcast_to_child_devices(child_id, command, db)
        
        # Save schedules to database
        for schedule in schedules:
            await db.downtime_schedules.update_one(
                {"child_id": ObjectId(child_id), "day_of_week": schedule.day_of_week},
                {"$set": {
                    "start_hour": schedule.start_hour,
                    "start_minute": schedule.start_minute,
                    "end_hour": schedule.end_hour,
                    "end_minute": schedule.end_minute,
                    "enabled": schedule.enabled,
                    "updated_at": datetime.utcnow()
                }},
                upsert=True
            )
        
        return {
            "status": "downtime_set",
            "devices_updated": devices_updated
        }
    
    @router.post("/emergency-unlock/{child_id}")
    async def emergency_unlock(child_id: str, duration_minutes: int = 30, current_user: dict = Depends(get_current_user)):
        """Emergency unlock for child's devices"""
        child = await verify_child_ownership(child_id, current_user)
        
        command = DeviceControl(
            command="emergency_unlock",
            parameters={
                "duration_minutes": duration_minutes,
                "reason": "Parent emergency unlock"
            }
        )
        
        devices_updated = await device_manager.broadcast_to_child_devices(child_id, command, db)
        
        return {
            "status": "devices_unlocked",
            "devices_updated": devices_updated,
            "duration_minutes": duration_minutes
        }
    
    @router.get("/device-status/{child_id}")
    async def get_device_status(child_id: str, current_user: dict = Depends(get_current_user)):
        """Get real-time status of child's devices"""
        child = await verify_child_ownership(child_id, current_user)
        
        devices = await db.devices.find({"child_id": ObjectId(child_id)}).to_list(100)
        
        status_info = []
        for device in devices:
            device_id = str(device["_id"])
            is_online = device_id in device_manager.connected_devices
            
            status_info.append({
                "device_id": device_id,
                "device_name": device["device_name"],
                "platform": device["platform"],
                "is_online": is_online,
                "last_seen": device["last_seen"],
                "current_status": device.get("status", "offline")
            })
        
        return {
            "child_name": child["name"],
            "devices": status_info,
            "total_devices": len(devices),
            "online_devices": sum(1 for d in status_info if d["is_online"])
        }
    
    # Add WebSocket support
    router.sio = device_manager.sio
    
    return router