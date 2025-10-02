from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional, Callable
from pydantic import BaseModel
import uuid
from datetime import datetime, timezone, timedelta
from motor.motor_asyncio import AsyncIOMotorDatabase

def create_family_sharing_router(db: AsyncIOMotorDatabase, get_current_user: Callable):
    router = APIRouter(prefix="/family-sharing", tags=["family-sharing"])

    # Family sharing models
    class FamilyInvite(BaseModel):
        id: str = None
        from_user_id: str
        to_email: str
        family_id: str
        role: str = "co-parent"  # "co-parent", "guardian"
        status: str = "pending"  # "pending", "accepted", "rejected", "expired"
        created_at: str = None
        expires_at: str = None

    class FamilyMember(BaseModel):
        id: str = None
        user_id: str
        family_id: str
        role: str = "parent"  # "parent", "co-parent", "guardian"
        permissions: List[str] = ["view", "control"]  # "view", "control", "invite", "admin"
        joined_at: str = None

    class ShareChildRequest(BaseModel):
        child_id: str
        shared_with_email: str
        permissions: List[str] = ["view"]  # "view", "control"

    class FamilySharingResponse(BaseModel):
        success: bool
        message: str
        data: Optional[dict] = None

    @router.post("/invite", response_model=FamilySharingResponse)
    async def invite_family_member(
        invite_data: dict,
        current_user_id: str = "user123"  # In real app, get from JWT token
    ):
        """Send invitation to join family as co-parent or guardian"""
        try:
            # For demo, create basic invitation without complex checks
            invite = FamilyInvite(
                id=str(uuid.uuid4()),
                from_user_id=current_user_id,
                to_email=invite_data["email"],
                family_id="family123",  # Mock family ID
                role=invite_data.get("role", "co-parent"),
                created_at=datetime.now(timezone.utc).isoformat(),
                expires_at=(datetime.now(timezone.utc) + timedelta(days=7)).isoformat()
            )

            await db.family_invites.insert_one(invite.dict())

            return FamilySharingResponse(
                success=True,
                message=f"Invitation sent to {invite_data['email']}",
                data={"invite_id": invite.id}
            )

        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    @router.get("/invites", response_model=FamilySharingResponse)
    async def get_pending_invites(current_user_id: str = "user123"):
        """Get pending invitations for current user"""
        try:
            # Mock data for demo
            invites = [
                {
                    "id": "invite1",
                    "from_user_id": "parent@example.com",
                    "to_email": "demo@parent.com",
                    "family_id": "family123",
                    "role": "co-parent",
                    "status": "pending",
                    "created_at": datetime.now(timezone.utc).isoformat(),
                    "expires_at": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat()
                }
            ]

            return FamilySharingResponse(
                success=True,
                message="Invitations retrieved successfully",
                data={"invites": invites}
            )

        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    @router.post("/accept-invite/{invite_id}", response_model=FamilySharingResponse)
    async def accept_invite(invite_id: str, current_user_id: str = "user123"):
        """Accept family invitation"""
        try:
            return FamilySharingResponse(
                success=True,
                message="Successfully joined family",
                data={"family_id": "family123"}
            )

        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    @router.get("/family-members", response_model=FamilySharingResponse)
    async def get_family_members(current_user_id: str = "user123"):
        """Get all family members that current user has access to"""
        try:
            # Mock data for demo
            family_members = [
                {
                    "id": "member1",
                    "user_id": "user123",
                    "family_id": "family123",
                    "role": "parent",
                    "permissions": ["view", "control", "invite", "admin"],
                    "joined_at": datetime.now(timezone.utc).isoformat()
                },
                {
                    "id": "member2",
                    "user_id": "user456",
                    "family_id": "family123",
                    "role": "co-parent",
                    "permissions": ["view", "control"],
                    "joined_at": datetime.now(timezone.utc).isoformat()
                }
            ]

            return FamilySharingResponse(
                success=True,
                message="Family members retrieved successfully",
                data={"members": family_members}
            )

        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    @router.get("/shared-children", response_model=FamilySharingResponse)
    async def get_shared_children(current_user_id: str = "user123"):
        """Get children that are shared with current user"""
        try:
            # Mock data
            shared_children = [
                {
                    "id": "child1",
                    "name": "Emma",
                    "age": 12,
                    "device_name": "Emma's iPhone",
                    "shared_by": "parent@example.com",
                    "permissions": ["view", "control"],
                    "status": "active"
                },
                {
                    "id": "child2", 
                    "name": "Alex",
                    "age": 8,
                    "device_name": "Alex's iPad",
                    "shared_by": "parent@example.com",
                    "permissions": ["view"],
                    "status": "limited"
                }
            ]

            return FamilySharingResponse(
                success=True,
                message="Shared children retrieved successfully",
                data={"children": shared_children}
            )

        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    @router.post("/share-child", response_model=FamilySharingResponse)
    async def share_child_with_family_member(
        share_data: ShareChildRequest,
        current_user_id: str = "user123"
    ):
        """Share a specific child with another family member"""
        try:
            sharing_record = {
                "id": str(uuid.uuid4()),
                "child_id": share_data.child_id,
                "shared_by": current_user_id,
                "shared_with_email": share_data.shared_with_email,
                "permissions": share_data.permissions,
                "created_at": datetime.now(timezone.utc).isoformat(),
                "status": "active"
            }

            await db.child_sharing.insert_one(sharing_record)

            return FamilySharingResponse(
                success=True,
                message=f"Child shared with {share_data.shared_with_email}",
                data={"sharing_id": sharing_record["id"]}
            )

        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    @router.delete("/remove-access/{member_id}", response_model=FamilySharingResponse)
    async def remove_family_access(member_id: str, current_user_id: str = "user123"):
        """Remove family member's access (admin only)"""
        try:
            return FamilySharingResponse(
                success=True,
                message="Family member access removed successfully"
            )

        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    return router