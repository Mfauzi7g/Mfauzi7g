from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from datetime import datetime
from typing import List, Optional
from enum import Enum

class TaskStatus(str, Enum):
    pending = "pending"
    completed = "completed"
    approved = "approved"
    rejected = "rejected"

class TaskCategory(str, Enum):
    chores = "chores"
    homework = "homework"
    reading = "reading"
    exercise = "exercise"
    creativity = "creativity"
    other = "other"

class Task(BaseModel):
    id: str
    child_id: str
    title: str
    description: str
    category: TaskCategory
    reward_minutes: int
    status: TaskStatus
    created_at: datetime
    completed_at: Optional[datetime] = None
    approved_at: Optional[datetime] = None

class TaskCreate(BaseModel):
    title: str = Field(..., min_length=1)
    description: str
    category: TaskCategory
    reward_minutes: int = Field(..., ge=5, le=120)  # 5-120 minutes

class RewardsData(BaseModel):
    child_name: str
    earned_minutes: int
    pending_tasks: List[Task]
    completed_tasks: List[Task]
    total_tasks_completed: int

def create_rewards_router(db: AsyncIOMotorDatabase, get_current_user):
    router = APIRouter(prefix="/rewards", tags=["rewards"])
    
    async def verify_child_ownership(child_id: str, current_user: dict):
        """Verify child belongs to current user"""
        child = await db.children.find_one({
            "_id": ObjectId(child_id),
            "user_id": ObjectId(current_user["_id"])
        })
        if not child:
            raise HTTPException(status_code=404, detail="Child not found")
        return child
    
    @router.get("/{child_id}", response_model=RewardsData)
    async def get_child_rewards(child_id: str, current_user: dict = Depends(get_current_user)):
        """Get child's tasks and rewards"""
        child = await verify_child_ownership(child_id, current_user)
        
        # Get all tasks for this child
        tasks_cursor = db.tasks.find({"child_id": ObjectId(child_id)}).sort("created_at", -1)
        
        pending_tasks = []
        completed_tasks = []
        total_completed = 0
        
        async for task in tasks_cursor:
            task_obj = Task(
                id=str(task["_id"]),
                child_id=str(task["child_id"]),
                title=task["title"],
                description=task["description"],
                category=task["category"],
                reward_minutes=task["reward_minutes"],
                status=task["status"],
                created_at=task["created_at"],
                completed_at=task.get("completed_at"),
                approved_at=task.get("approved_at")
            )
            
            if task["status"] in ["pending", "completed"]:
                pending_tasks.append(task_obj)
            elif task["status"] == "approved":
                completed_tasks.append(task_obj)
                total_completed += 1
        
        return RewardsData(
            child_name=child["name"],
            earned_minutes=child.get("earned_minutes", 0),
            pending_tasks=pending_tasks,
            completed_tasks=completed_tasks[:10],  # Last 10 completed tasks
            total_tasks_completed=total_completed
        )
    
    @router.post("/{child_id}/tasks", response_model=Task)
    async def create_task(child_id: str, task_data: TaskCreate, current_user: dict = Depends(get_current_user)):
        """Create a task for a child"""
        child = await verify_child_ownership(child_id, current_user)
        
        task_dict = {
            "child_id": ObjectId(child_id),
            "title": task_data.title,
            "description": task_data.description,
            "category": task_data.category,
            "reward_minutes": task_data.reward_minutes,
            "status": "pending",
            "created_at": datetime.utcnow()
        }
        
        result = await db.tasks.insert_one(task_dict)
        task_dict["_id"] = result.inserted_id
        
        return Task(
            id=str(result.inserted_id),
            child_id=str(task_dict["child_id"]),
            title=task_dict["title"],
            description=task_dict["description"],
            category=task_dict["category"],
            reward_minutes=task_dict["reward_minutes"],
            status=task_dict["status"],
            created_at=task_dict["created_at"]
        )
    
    @router.put("/tasks/{task_id}/complete")
    async def complete_task(task_id: str, current_user: dict = Depends(get_current_user)):
        """Mark task as completed (by child)"""
        task = await db.tasks.find_one({"_id": ObjectId(task_id)})
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")
        
        # Verify task belongs to user's child
        child = await db.children.find_one({
            "_id": task["child_id"],
            "user_id": ObjectId(current_user["_id"])
        })
        if not child:
            raise HTTPException(status_code=404, detail="Task not found")
        
        if task["status"] != "pending":
            raise HTTPException(status_code=400, detail="Task is not in pending status")
        
        await db.tasks.update_one(
            {"_id": ObjectId(task_id)},
            {
                "$set": {
                    "status": "completed",
                    "completed_at": datetime.utcnow()
                }
            }
        )
        
        return {"message": "Task marked as completed. Waiting for parent approval."}
    
    @router.put("/tasks/{task_id}/approve")
    async def approve_task(task_id: str, current_user: dict = Depends(get_current_user)):
        """Approve completed task (by parent)"""
        task = await db.tasks.find_one({"_id": ObjectId(task_id)})
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")
        
        # Verify task belongs to user's child
        child = await db.children.find_one({
            "_id": task["child_id"],
            "user_id": ObjectId(current_user["_id"])
        })
        if not child:
            raise HTTPException(status_code=404, detail="Task not found")
        
        if task["status"] != "completed":
            raise HTTPException(status_code=400, detail="Task is not completed")
        
        # Approve task and add reward minutes
        await db.tasks.update_one(
            {"_id": ObjectId(task_id)},
            {
                "$set": {
                    "status": "approved",
                    "approved_at": datetime.utcnow()
                }
            }
        )
        
        # Add earned minutes to child
        await db.children.update_one(
            {"_id": task["child_id"]},
            {"$inc": {"earned_minutes": task["reward_minutes"]}}
        )
        
        return {"message": f"Task approved! {task['reward_minutes']} minutes added to {child['name']}'s time bank."}
    
    @router.put("/tasks/{task_id}/reject")
    async def reject_task(task_id: str, current_user: dict = Depends(get_current_user)):
        """Reject completed task (by parent)"""
        task = await db.tasks.find_one({"_id": ObjectId(task_id)})
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")
        
        # Verify task belongs to user's child
        child = await db.children.find_one({
            "_id": task["child_id"],
            "user_id": ObjectId(current_user["_id"])
        })
        if not child:
            raise HTTPException(status_code=404, detail="Task not found")
        
        if task["status"] != "completed":
            raise HTTPException(status_code=400, detail="Task is not completed")
        
        await db.tasks.update_one(
            {"_id": ObjectId(task_id)},
            {"$set": {"status": "rejected"}}
        )
        
        return {"message": "Task rejected"}
    
    @router.post("/{child_id}/redeem")
    async def redeem_time(child_id: str, minutes_to_redeem: int, current_user: dict = Depends(get_current_user)):
        """Redeem earned minutes for extra screen time"""
        child = await verify_child_ownership(child_id, current_user)
        
        if child.get("earned_minutes", 0) < minutes_to_redeem:
            raise HTTPException(status_code=400, detail="Not enough earned minutes")
        
        if minutes_to_redeem <= 0:
            raise HTTPException(status_code=400, detail="Invalid minutes amount")
        
        # Deduct earned minutes
        await db.children.update_one(
            {"_id": ObjectId(child_id)},
            {"$inc": {"earned_minutes": -minutes_to_redeem}}
        )
        
        # Here you would implement the logic to actually give extra screen time
        # For now, we'll just log it
        redemption_record = {
            "child_id": ObjectId(child_id),
            "minutes_redeemed": minutes_to_redeem,
            "redeemed_at": datetime.utcnow()
        }
        await db.redemptions.insert_one(redemption_record)
        
        return {"message": f"Successfully redeemed {minutes_to_redeem} minutes of extra screen time!"}
    
    return router