from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from datetime import datetime
from typing import List, Optional
from enum import Enum

class ChildStatus(str, Enum):
    active = "active"
    downtime = "downtime"
    limited = "limited"

class Child(BaseModel):
    id: str
    name: str
    age: int
    device_name: str
    avatar: str
    status: ChildStatus
    earned_minutes: int = 0
    created_at: datetime

class ChildCreate(BaseModel):
    name: str = Field(..., min_length=1)
    age: int = Field(..., ge=1, le=18)
    device_name: str
    avatar: str

class ChildUpdate(BaseModel):
    name: Optional[str] = None
    age: Optional[int] = None
    device_name: Optional[str] = None
    avatar: Optional[str] = None
    status: Optional[ChildStatus] = None

def create_family_router(db: AsyncIOMotorDatabase, get_current_user):
    router = APIRouter(prefix="/family", tags=["family"])
    
    @router.get("", response_model=List[Child])
    async def get_family(current_user: dict = Depends(get_current_user)):
        """Get all children in the family"""
        children_cursor = db.children.find({"user_id": ObjectId(current_user["_id"])})
        children = []
        
        async for child in children_cursor:
            child_data = Child(
                id=str(child["_id"]),
                name=child["name"],
                age=child["age"],
                device_name=child["device_name"],
                avatar=child["avatar"],
                status=child.get("status", "active"),
                earned_minutes=child.get("earned_minutes", 0),
                created_at=child["created_at"]
            )
            children.append(child_data)
        
        return children
    
    @router.post("/children", response_model=Child)
    async def add_child(child_data: ChildCreate, current_user: dict = Depends(get_current_user)):
        """Add a new child to the family"""
        child_dict = {
            "user_id": ObjectId(current_user["_id"]),
            "name": child_data.name,
            "age": child_data.age,
            "device_name": child_data.device_name,
            "avatar": child_data.avatar,
            "status": "active",
            "earned_minutes": 0,
            "created_at": datetime.utcnow()
        }
        
        result = await db.children.insert_one(child_dict)
        child_dict["_id"] = result.inserted_id
        
        return Child(
            id=str(result.inserted_id),
            name=child_dict["name"],
            age=child_dict["age"],
            device_name=child_dict["device_name"],
            avatar=child_dict["avatar"],
            status=child_dict["status"],
            earned_minutes=child_dict["earned_minutes"],
            created_at=child_dict["created_at"]
        )
    
    @router.put("/children/{child_id}", response_model=Child)
    async def update_child(child_id: str, child_update: ChildUpdate, current_user: dict = Depends(get_current_user)):
        """Update child information"""
        # Verify child belongs to current user
        child = await db.children.find_one({
            "_id": ObjectId(child_id),
            "user_id": ObjectId(current_user["_id"])
        })
        
        if not child:
            raise HTTPException(status_code=404, detail="Child not found")
        
        # Update fields
        update_data = {k: v for k, v in child_update.dict(exclude_unset=True).items()}
        if update_data:
            await db.children.update_one(
                {"_id": ObjectId(child_id)},
                {"$set": update_data}
            )
        
        # Get updated child
        updated_child = await db.children.find_one({"_id": ObjectId(child_id)})
        
        return Child(
            id=str(updated_child["_id"]),
            name=updated_child["name"],
            age=updated_child["age"],
            device_name=updated_child["device_name"],
            avatar=updated_child["avatar"],
            status=updated_child["status"],
            earned_minutes=updated_child.get("earned_minutes", 0),
            created_at=updated_child["created_at"]
        )
    
    @router.delete("/children/{child_id}")
    async def delete_child(child_id: str, current_user: dict = Depends(get_current_user)):
        """Remove child from family"""
        result = await db.children.delete_one({
            "_id": ObjectId(child_id),
            "user_id": ObjectId(current_user["_id"])
        })
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Child not found")
        
        # Also delete related data
        await db.screen_time.delete_many({"child_id": ObjectId(child_id)})
        await db.app_limits.delete_many({"child_id": ObjectId(child_id)})
        await db.downtime_schedules.delete_many({"child_id": ObjectId(child_id)})
        await db.tasks.delete_many({"child_id": ObjectId(child_id)})
        
        return {"message": "Child removed successfully"}
    
    return router