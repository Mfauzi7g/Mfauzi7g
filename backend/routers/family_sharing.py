from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional, Callable
from pydantic import BaseModel
import uuid
from datetime import datetime, timezone
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
        # Check if user has permission to invite
        family_member = await db.family_members.find_one({
            "user_id": current_user_id,
            "permissions": {"$in": ["invite", "admin"]}
        })
        
        if not family_member:
            raise HTTPException(status_code=403, detail="No permission to invite family members")

        # Check if invitation already exists
        existing_invite = await db.family_invites.find_one({
            "to_email": invite_data["email"],
            "family_id": family_member["family_id"],
            "status": "pending"
        })
        
        if existing_invite:
            raise HTTPException(status_code=400, detail="Invitation already sent to this email")

        # Create invitation
        invite = FamilyInvite(
            id=str(uuid.uuid4()),
            from_user_id=current_user_id,
            to_email=invite_data["email"],
            family_id=family_member["family_id"],
            role=invite_data.get("role", "co-parent"),
            created_at=datetime.now(timezone.utc).isoformat(),
            expires_at=datetime.now(timezone.utc).replace(day=datetime.now().day + 7).isoformat()  # 7 days
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
        # Get user's email first (in real app, get from user profile)
        user_email = "demo@parent.com"  # Mock for now
        
        invites = await db.family_invites.find({
            "to_email": user_email,
            "status": "pending"
        }).to_list(length=None)

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
        # Find the invitation
        invite = await db.family_invites.find_one({"id": invite_id, "status": "pending"})
        
        if not invite:
            raise HTTPException(status_code=404, detail="Invitation not found or already processed")

        # Check if invitation is still valid
        expires_at = datetime.fromisoformat(invite["expires_at"].replace('Z', '+00:00'))
        if expires_at < datetime.now(timezone.utc):
            await db.family_invites.update_one(
                {"id": invite_id},
                {"$set": {"status": "expired"}}
            )
            raise HTTPException(status_code=400, detail="Invitation has expired")

        # Add user to family
        family_member = FamilyMember(
            id=str(uuid.uuid4()),
            user_id=current_user_id,
            family_id=invite["family_id"],
            role=invite["role"],
            permissions=["view", "control"] if invite["role"] == "co-parent" else ["view"],
            joined_at=datetime.now(timezone.utc).isoformat()
        )

        await db.family_members.insert_one(family_member.dict())

        # Mark invitation as accepted
        await db.family_invites.update_one(
            {"id": invite_id},
            {"$set": {"status": "accepted"}}
        )

        return FamilySharingResponse(
            success=True,
            message="Successfully joined family",
            data={"family_id": invite["family_id"]}
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/family-members", response_model=FamilySharingResponse)
async def get_family_members(current_user_id: str = "user123"):
    """Get all family members that current user has access to"""
    try:
        # Get user's family membership
        user_family = await db.family_members.find_one({"user_id": current_user_id})
        
        if not user_family:
            return FamilySharingResponse(
                success=True,
                message="No family found",
                data={"members": []}
            )

        # Get all family members
        family_members = await db.family_members.find({
            "family_id": user_family["family_id"]
        }).to_list(length=None)

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
        # Get user's family membership
        user_family = await db.family_members.find_one({"user_id": current_user_id})
        
        if not user_family:
            return FamilySharingResponse(
                success=True,
                message="No shared children found",
                data={"children": []}
            )

        # Get children in the family (would need to modify children collection to include family_id)
        # For now, return mock data based on permissions
        shared_children = [
            {
                "id": "child1",
                "name": "Emma",
                "age": 12,
                "device_name": "Emma's iPhone",
                "shared_by": "parent@example.com",
                "permissions": user_family["permissions"],
                "status": "active"
            },
            {
                "id": "child2", 
                "name": "Alex",
                "age": 8,
                "device_name": "Alex's iPad",
                "shared_by": "parent@example.com",
                "permissions": user_family["permissions"],
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
        # In real implementation, check if user owns the child
        # and create sharing record
        
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
        # Check if user has admin permission
        admin_member = await db.family_members.find_one({
            "user_id": current_user_id,
            "permissions": {"$in": ["admin"]}
        })
        
        if not admin_member:
            raise HTTPException(status_code=403, detail="Admin permission required")

        # Remove family member
        result = await db.family_members.delete_one({"id": member_id})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Family member not found")

        return FamilySharingResponse(
            success=True,
            message="Family member access removed successfully"
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))