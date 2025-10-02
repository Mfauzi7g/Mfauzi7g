from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from datetime import datetime
from typing import List, Optional
from enum import Enum

class MessageType(str, Enum):
    text = "text"
    image = "image"
    task_completed = "task_completed"
    emergency_request = "emergency_request"
    system = "system"

class MessageStatus(str, Enum):
    sent = "sent"
    delivered = "delivered"
    read = "read"

class ChatMessage(BaseModel):
    id: str
    conversation_id: str
    sender_type: str  # "parent" or "child"
    sender_id: str
    sender_name: str
    message_type: MessageType
    content: str
    image_url: Optional[str] = None
    timestamp: datetime
    status: MessageStatus
    reply_to: Optional[str] = None

class MessageCreate(BaseModel):
    child_id: str
    message_type: MessageType = "text"
    content: str
    image_url: Optional[str] = None
    reply_to: Optional[str] = None

class MessageRead(BaseModel):
    message_ids: List[str]

class Conversation(BaseModel):
    id: str
    parent_id: str
    child_id: str
    child_name: str
    last_message: Optional[ChatMessage] = None
    unread_count: int
    created_at: datetime
    updated_at: datetime

def create_chat_router(db: AsyncIOMotorDatabase, get_current_user, device_manager):
    router = APIRouter(prefix="/chat", tags=["chat"])
    
    async def verify_child_ownership(child_id: str, current_user: dict):
        """Verify child belongs to current user"""
        child = await db.children.find_one({
            "_id": ObjectId(child_id),
            "user_id": ObjectId(current_user["_id"])
        })
        if not child:
            raise HTTPException(status_code=404, detail="Child not found")
        return child
    
    @router.get("/conversations", response_model=List[Conversation])
    async def get_conversations(current_user: dict = Depends(get_current_user)):
        """Get all conversations for the parent"""
        # Get all children for this parent
        children_cursor = db.children.find({"user_id": ObjectId(current_user["_id"])})
        conversations = []
        
        async for child in children_cursor:
            child_id = str(child["_id"])
            
            # Get last message for this conversation
            last_message_doc = await db.chat_messages.find_one(
                {"child_id": child_id},
                sort=[("timestamp", -1)]
            )
            
            last_message = None
            if last_message_doc:
                last_message = ChatMessage(
                    id=str(last_message_doc["_id"]),
                    conversation_id=f"parent_{current_user['_id']}_child_{child_id}",
                    sender_type=last_message_doc["sender_type"],
                    sender_id=str(last_message_doc["sender_id"]),
                    sender_name=last_message_doc["sender_name"],
                    message_type=last_message_doc["message_type"],
                    content=last_message_doc["content"],
                    image_url=last_message_doc.get("image_url"),
                    timestamp=last_message_doc["timestamp"],
                    status=last_message_doc["status"],
                    reply_to=last_message_doc.get("reply_to")
                )
            
            # Count unread messages from child
            unread_count = await db.chat_messages.count_documents({
                "child_id": child_id,
                "sender_type": "child",
                "status": {"$ne": "read"}
            })
            
            conversation = Conversation(
                id=f"parent_{current_user['_id']}_child_{child_id}",
                parent_id=str(current_user["_id"]),
                child_id=child_id,
                child_name=child["name"],
                last_message=last_message,
                unread_count=unread_count,
                created_at=child["created_at"],
                updated_at=last_message.timestamp if last_message else child["created_at"]
            )
            conversations.append(conversation)
        
        # Sort by last message timestamp
        conversations.sort(key=lambda x: x.updated_at, reverse=True)
        return conversations
    
    @router.get("/messages/{child_id}", response_model=List[ChatMessage])
    async def get_messages(child_id: str, limit: int = 50, offset: int = 0, current_user: dict = Depends(get_current_user)):
        """Get chat messages for a specific child"""
        child = await verify_child_ownership(child_id, current_user)
        
        messages_cursor = db.chat_messages.find(
            {"child_id": child_id}
        ).sort("timestamp", -1).skip(offset).limit(limit)
        
        messages = []
        async for msg in messages_cursor:
            message = ChatMessage(
                id=str(msg["_id"]),
                conversation_id=f"parent_{current_user['_id']}_child_{child_id}",
                sender_type=msg["sender_type"],
                sender_id=str(msg["sender_id"]),
                sender_name=msg["sender_name"],
                message_type=msg["message_type"],
                content=msg["content"],
                image_url=msg.get("image_url"),
                timestamp=msg["timestamp"],
                status=msg["status"],
                reply_to=msg.get("reply_to")
            )
            messages.append(message)
        
        # Reverse to get chronological order
        messages.reverse()
        return messages
    
    @router.post("/send", response_model=ChatMessage)
    async def send_message(message_data: MessageCreate, current_user: dict = Depends(get_current_user)):
        """Send message to child"""
        child = await verify_child_ownership(message_data.child_id, current_user)
        
        message_dict = {
            "child_id": message_data.child_id,
            "sender_type": "parent",
            "sender_id": ObjectId(current_user["_id"]),
            "sender_name": current_user["name"],
            "message_type": message_data.message_type,
            "content": message_data.content,
            "image_url": message_data.image_url,
            "timestamp": datetime.utcnow(),
            "status": "sent",
            "reply_to": message_data.reply_to
        }
        
        result = await db.chat_messages.insert_one(message_dict)
        message_dict["_id"] = result.inserted_id
        
        # Send real-time notification to child device
        await device_manager.broadcast_to_child_devices(
            message_data.child_id,
            {
                "command": "new_message",
                "parameters": {
                    "message_id": str(result.inserted_id),
                    "sender_name": current_user["name"],
                    "content": message_data.content,
                    "message_type": message_data.message_type
                }
            },
            db
        )
        
        return ChatMessage(
            id=str(result.inserted_id),
            conversation_id=f"parent_{current_user['_id']}_child_{message_data.child_id}",
            sender_type="parent",
            sender_id=str(current_user["_id"]),
            sender_name=current_user["name"],
            message_type=message_data.message_type,
            content=message_data.content,
            image_url=message_data.image_url,
            timestamp=message_dict["timestamp"],
            status="sent",
            reply_to=message_data.reply_to
        )
    
    @router.post("/child-message/{child_id}")
    async def receive_child_message(child_id: str, content: str, message_type: str = "text"):
        """Receive message from child device (called by child app)"""
        # Find the child and parent
        child = await db.children.find_one({"_id": ObjectId(child_id)})
        if not child:
            raise HTTPException(status_code=404, detail="Child not found")
        
        parent = await db.users.find_one({"_id": child["user_id"]})
        if not parent:
            raise HTTPException(status_code=404, detail="Parent not found")
        
        message_dict = {
            "child_id": child_id,
            "sender_type": "child",
            "sender_id": ObjectId(child_id),
            "sender_name": child["name"],
            "message_type": message_type,
            "content": content,
            "timestamp": datetime.utcnow(),
            "status": "sent"
        }
        
        result = await db.chat_messages.insert_one(message_dict)
        
        # Send real-time notification to parent dashboard
        # This would typically go through WebSocket to parent's browser session
        
        return {
            "message_id": str(result.inserted_id),
            "status": "sent",
            "timestamp": message_dict["timestamp"]
        }
    
    @router.post("/mark-read")
    async def mark_messages_read(read_data: MessageRead, current_user: dict = Depends(get_current_user)):
        """Mark messages as read"""
        message_object_ids = [ObjectId(msg_id) for msg_id in read_data.message_ids]
        
        result = await db.chat_messages.update_many(
            {"_id": {"$in": message_object_ids}},
            {"$set": {"status": "read", "read_at": datetime.utcnow()}}
        )
        
        return {
            "updated_count": result.modified_count,
            "status": "success"
        }
    
    @router.post("/emergency-request/{child_id}")
    async def send_emergency_request(child_id: str, reason: str, current_user: dict = Depends(get_current_user)):
        """Child sends emergency unlock request to parent"""
        child = await verify_child_ownership(child_id, current_user)
        
        message_dict = {
            "child_id": child_id,
            "sender_type": "child",
            "sender_id": ObjectId(child_id),
            "sender_name": child["name"],
            "message_type": "emergency_request",
            "content": f"Emergency unlock request: {reason}",
            "timestamp": datetime.utcnow(),
            "status": "sent"
        }
        
        result = await db.chat_messages.insert_one(message_dict)
        
        # Send urgent notification to parent
        # In a real app, this would trigger push notification
        
        return {
            "message_id": str(result.inserted_id),
            "status": "emergency_request_sent"
        }
    
    @router.get("/quick-responses")
    async def get_quick_responses():
        """Get predefined quick response messages"""
        return {
            "parent_responses": [
                "Great job! 👏",
                "Keep it up!",
                "Time to do homework 📚",
                "Dinner is ready 🍽️",
                "Please clean your room",
                "Good night! 😴",
                "I'm proud of you ❤️",
                "Emergency unlock approved",
                "Please wait, not right now"
            ],
            "child_responses": [
                "Ok! 👍",
                "Thank you!",
                "Can I have 15 more minutes?",
                "I completed my task!",
                "Emergency - need to contact someone",
                "I'm doing homework",
                "Almost done!",
                "Good night mom/dad ❤️"
            ]
        }
    
    return router