from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from datetime import datetime, date, timedelta
from typing import List, Dict
from collections import defaultdict

class AppUsage(BaseModel):
    name: str
    category: str
    time_spent: Dict[str, int]  # {"hours": 1, "minutes": 30}
    limit: Dict[str, int] = None  # {"hours": 2, "minutes": 0}
    status: str  # "within_limit", "over_limit", "always_allowed"

class WeeklyData(BaseModel):
    day: str
    hours: float

class ScreenTimeData(BaseModel):
    today: Dict[str, int]
    this_week: Dict[str, int]
    last_week: Dict[str, int]

class ScreenTimeUsage(BaseModel):
    child_id: str
    app_name: str
    category: str
    minutes_used: int
    usage_date: date = Field(default_factory=date.today)

def create_screen_time_router(db: AsyncIOMotorDatabase, get_current_user):
    router = APIRouter(prefix="/screen-time", tags=["screen-time"])
    
    async def verify_child_ownership(child_id: str, current_user: dict):
        """Verify child belongs to current user"""
        child = await db.children.find_one({
            "_id": ObjectId(child_id),
            "user_id": ObjectId(current_user["_id"])
        })
        if not child:
            raise HTTPException(status_code=404, detail="Child not found")
        return child
    
    @router.get("/{child_id}", response_model=List[AppUsage])
    async def get_child_screen_time(child_id: str, current_user: dict = Depends(get_current_user)):
        """Get child's app usage for today"""
        child = await verify_child_ownership(child_id, current_user)
        
        # Get today's usage
        today = date.today()
        usage_cursor = db.screen_time.find({
            "child_id": ObjectId(child_id),
            "date": today
        })
        
        # Group by app name
        app_usage = defaultdict(int)
        async for usage in usage_cursor:
            app_usage[usage["app_name"]] += usage["minutes_used"]
        
        # Get app limits
        limits_cursor = db.app_limits.find({"child_id": ObjectId(child_id)})
        app_limits = {}
        async for limit in limits_cursor:
            app_limits[limit["app_name"]] = limit["daily_limit_minutes"]
        
        # Format response
        result = []
        for app_name, minutes in app_usage.items():
            hours = minutes // 60
            mins = minutes % 60
            
            limit_minutes = app_limits.get(app_name)
            limit_data = None
            status = "always_allowed"
            
            if limit_minutes is not None:
                limit_hours = limit_minutes // 60
                limit_mins = limit_minutes % 60
                limit_data = {"hours": limit_hours, "minutes": limit_mins}
                status = "over_limit" if minutes > limit_minutes else "within_limit"
            
            # Get category from predefined mapping
            category_map = {
                "Instagram": "Social",
                "TikTok": "Entertainment", 
                "YouTube": "Entertainment",
                "Messages": "Communication",
                "Minecraft": "Games",
                "Khan Academy Kids": "Education",
                "Roblox": "Games"
            }
            
            result.append(AppUsage(
                name=app_name,
                category=category_map.get(app_name, "Other"),
                time_spent={"hours": hours, "minutes": mins},
                limit=limit_data,
                status=status
            ))
        
        return result
    
    @router.post("/{child_id}/usage")
    async def log_app_usage(child_id: str, usage: ScreenTimeUsage, current_user: dict = Depends(get_current_user)):
        """Log app usage for a child"""
        child = await verify_child_ownership(child_id, current_user)
        
        usage_dict = {
            "child_id": ObjectId(child_id),
            "app_name": usage.app_name,
            "category": usage.category,
            "minutes_used": usage.minutes_used,
            "date": usage.date,
            "created_at": datetime.utcnow()
        }
        
        await db.screen_time.insert_one(usage_dict)
        return {"message": "Usage logged successfully"}
    
    @router.get("/{child_id}/weekly", response_model=List[WeeklyData])
    async def get_weekly_screen_time(child_id: str, current_user: dict = Depends(get_current_user)):
        """Get weekly screen time data"""
        child = await verify_child_ownership(child_id, current_user)
        
        # Get last 7 days of data
        end_date = date.today()
        start_date = end_date - timedelta(days=6)
        
        # Aggregate data by day
        pipeline = [
            {
                "$match": {
                    "child_id": ObjectId(child_id),
                    "date": {"$gte": start_date, "$lte": end_date}
                }
            },
            {
                "$group": {
                    "_id": "$date",
                    "total_minutes": {"$sum": "$minutes_used"}
                }
            },
            {"$sort": {"_id": 1}}
        ]
        
        daily_usage = {}
        async for day_data in db.screen_time.aggregate(pipeline):
            daily_usage[day_data["_id"]] = day_data["total_minutes"]
        
        # Format for last 7 days
        result = []
        for i in range(7):
            current_date = start_date + timedelta(days=i)
            day_name = current_date.strftime("%a")
            minutes = daily_usage.get(current_date, 0)
            hours = minutes / 60.0
            
            result.append(WeeklyData(
                day=day_name,
                hours=round(hours, 1)
            ))
        
        return result
    
    @router.get("/{child_id}/summary", response_model=ScreenTimeData)
    async def get_screen_time_summary(child_id: str, current_user: dict = Depends(get_current_user)):
        """Get screen time summary (today, this week, last week)"""
        child = await verify_child_ownership(child_id, current_user)
        
        today = date.today()
        week_start = today - timedelta(days=today.weekday())
        last_week_start = week_start - timedelta(days=7)
        last_week_end = week_start - timedelta(days=1)
        
        # Today's usage
        today_cursor = db.screen_time.aggregate([
            {"$match": {"child_id": ObjectId(child_id), "date": today}},
            {"$group": {"_id": None, "total_minutes": {"$sum": "$minutes_used"}}}
        ])
        today_minutes = 0
        async for result in today_cursor:
            today_minutes = result["total_minutes"]
        
        # This week's usage
        week_cursor = db.screen_time.aggregate([
            {"$match": {"child_id": ObjectId(child_id), "date": {"$gte": week_start, "$lte": today}}},
            {"$group": {"_id": None, "total_minutes": {"$sum": "$minutes_used"}}}
        ])
        week_minutes = 0
        async for result in week_cursor:
            week_minutes = result["total_minutes"]
        
        # Last week's usage
        last_week_cursor = db.screen_time.aggregate([
            {"$match": {"child_id": ObjectId(child_id), "date": {"$gte": last_week_start, "$lte": last_week_end}}},
            {"$group": {"_id": None, "total_minutes": {"$sum": "$minutes_used"}}}
        ])
        last_week_minutes = 0
        async for result in last_week_cursor:
            last_week_minutes = result["total_minutes"]
        
        def minutes_to_hours_mins(minutes):
            return {"hours": minutes // 60, "minutes": minutes % 60}
        
        return ScreenTimeData(
            today=minutes_to_hours_mins(today_minutes),
            this_week=minutes_to_hours_mins(week_minutes),
            last_week=minutes_to_hours_mins(last_week_minutes)
        )
    
    return router