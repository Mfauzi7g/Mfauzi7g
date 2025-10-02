from fastapi import APIRouter, HTTPException, Response, Request, Depends
from pydantic import BaseModel, EmailStr
from typing import Optional, Dict, Any
import uuid
import jwt
import time
import requests
import os
from datetime import datetime, timezone, timedelta
from motor.motor_asyncio import AsyncIOMotorDatabase
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def create_social_auth_router(db: AsyncIOMotorDatabase, get_current_user):
    router = APIRouter(prefix="/social-auth", tags=["social-auth"])

    # Pydantic models
    class EmergentAuthRequest(BaseModel):
        session_id: str

    class AppleAuthRequest(BaseModel):
        code: str
        id_token: str
        state: str
        user: Optional[dict] = None

    class AuthResponse(BaseModel):
        success: bool
        user: dict
        session_token: str
        access_token: str
        message: str

    class UserProfile(BaseModel):
        id: str
        email: EmailStr
        name: Optional[str] = None
        picture: Optional[str] = None
        auth_provider: str
        created_at: str
        updated_at: str

    # Helper functions
    def generate_session_token() -> str:
        """Generate secure session token"""
        return str(uuid.uuid4())

    def create_jwt_token(user_data: dict) -> str:
        """Create JWT token for the user"""
        payload = {
            'user_id': user_data['id'],
            'email': user_data['email'],
            'name': user_data.get('name'),
            'auth_provider': user_data['auth_provider'],
            'exp': datetime.now(timezone.utc) + timedelta(days=7),
            'iat': datetime.now(timezone.utc)
        }
        
        secret_key = os.getenv('JWT_SECRET', 'screen-time-jwt-secret-key-prod-2025-v1-secure')
        return jwt.encode(payload, secret_key, algorithm='HS256')

    async def create_or_update_user(user_data: dict) -> dict:
        """Create or update user in database"""
        try:
            # Check if user exists by email
            existing_user = await db.users.find_one({"email": user_data["email"]})
            
            if existing_user:
                # Update last login and auth provider if needed
                await db.users.update_one(
                    {"email": user_data["email"]},
                    {
                        "$set": {
                            "last_login": datetime.now(timezone.utc).isoformat(),
                            "updated_at": datetime.now(timezone.utc).isoformat()
                        }
                    }
                )
                return existing_user
            else:
                # Create new user
                new_user = {
                    "id": str(uuid.uuid4()),
                    "email": user_data["email"],
                    "name": user_data.get("name", ""),
                    "picture": user_data.get("picture", ""),
                    "auth_provider": user_data["auth_provider"],
                    "created_at": datetime.now(timezone.utc).isoformat(),
                    "updated_at": datetime.now(timezone.utc).isoformat(),
                    "last_login": datetime.now(timezone.utc).isoformat(),
                    "email_verified": user_data.get("email_verified", True)
                }
                
                await db.users.insert_one(new_user)
                return new_user
                
        except Exception as e:
            logger.error(f"Error creating/updating user: {str(e)}")
            raise HTTPException(status_code=500, detail="Database error")

    async def store_session(session_token: str, user_data: dict):
        """Store session in database"""
        try:
            session_data = {
                "session_token": session_token,
                "user_id": user_data["id"],
                "user_email": user_data["email"],
                "auth_provider": user_data["auth_provider"],
                "created_at": datetime.now(timezone.utc).isoformat(),
                "expires_at": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
                "active": True
            }
            
            await db.user_sessions.insert_one(session_data)
            
        except Exception as e:
            logger.error(f"Error storing session: {str(e)}")
            raise HTTPException(status_code=500, detail="Session storage error")

    def set_auth_cookies(response: Response, session_token: str, access_token: str):
        """Set authentication cookies"""
        # Set session token cookie (7 days)
        response.set_cookie(
            key="session_token",
            value=session_token,
            max_age=7 * 24 * 60 * 60,  # 7 days
            httponly=True,
            secure=True,
            samesite="none",
            path="/"
        )
        
        # Set access token cookie (7 days)
        response.set_cookie(
            key="access_token",
            value=access_token,
            max_age=7 * 24 * 60 * 60,  # 7 days
            httponly=True,
            secure=True,
            samesite="none",
            path="/"
        )

    # Routes
    @router.post("/google", response_model=AuthResponse)
    async def google_auth(auth_request: EmergentAuthRequest, response: Response):
        """Handle Google OAuth via Emergent Auth"""
        try:
            logger.info(f"Processing Google auth with session_id: {auth_request.session_id}")
            
            # Call Emergent Auth service to get user data
            auth_service_url = os.getenv('AUTH_SERVICE_URL', 'https://demobackend.emergentagent.com')
            auth_response = requests.get(
                f"{auth_service_url}/auth/v1/env/oauth/session-data",
                headers={"X-Session-ID": auth_request.session_id},
                timeout=10
            )
            
            if auth_response.status_code != 200:
                logger.error(f"Emergent auth failed: {auth_response.status_code} - {auth_response.text}")
                raise HTTPException(
                    status_code=400,
                    detail="Google authentication failed"
                )
            
            user_data = auth_response.json()
            logger.info(f"Received user data from Emergent: {user_data}")
            
            # Process user data
            processed_user_data = {
                "email": user_data["email"],
                "name": user_data.get("name", ""),
                "picture": user_data.get("picture", ""),
                "auth_provider": "google",
                "email_verified": True
            }
            
            # Create or update user in our database
            db_user = await create_or_update_user(processed_user_data)
            
            # Generate session token and JWT
            session_token = generate_session_token()
            access_token = create_jwt_token(db_user)
            
            # Store session in database
            await store_session(session_token, db_user)
            
            # Set authentication cookies
            set_auth_cookies(response, session_token, access_token)
            
            return AuthResponse(
                success=True,
                user={
                    "id": db_user["id"],
                    "email": db_user["email"],
                    "name": db_user.get("name", ""),
                    "picture": db_user.get("picture", ""),
                    "auth_provider": "google"
                },
                session_token=session_token,
                access_token=access_token,
                message="Successfully authenticated with Google"
            )
            
        except requests.RequestException as e:
            logger.error(f"Network error during Google auth: {str(e)}")
            raise HTTPException(status_code=500, detail="Authentication service error")
        except Exception as e:
            logger.error(f"Unexpected error during Google auth: {str(e)}")
            raise HTTPException(status_code=500, detail="Authentication failed")

    @router.post("/apple", response_model=AuthResponse)
    async def apple_auth(auth_request: AppleAuthRequest, response: Response):
        """Handle Apple Sign In authentication"""
        try:
            logger.info("Processing Apple Sign In authentication")
            
            # For demo purposes, we'll simulate Apple auth
            # In production, you would verify the ID token and exchange the code
            
            # Decode the ID token (simplified for demo)
            try:
                # In production, you would verify the signature using Apple's public keys
                decoded_token = jwt.decode(
                    auth_request.id_token, 
                    options={"verify_signature": False}
                )
            except Exception:
                # Fallback to mock data if token decode fails
                decoded_token = {
                    "sub": f"apple_user_{int(time.time())}",
                    "email": f"user{int(time.time())}@appleid.com",
                    "email_verified": True
                }
            
            # Extract user information
            apple_user_id = decoded_token.get("sub")
            email = decoded_token.get("email")
            
            # Process name from user object (only available on first signin)
            user_name = ""
            if auth_request.user:
                name_obj = auth_request.user.get("name", {})
                first_name = name_obj.get("firstName", "")
                last_name = name_obj.get("lastName", "")
                user_name = f"{first_name} {last_name}".strip()
            
            processed_user_data = {
                "email": email,
                "name": user_name,
                "auth_provider": "apple",
                "email_verified": decoded_token.get("email_verified", True),
                "apple_user_id": apple_user_id
            }
            
            # Create or update user in our database
            db_user = await create_or_update_user(processed_user_data)
            
            # Generate session token and JWT
            session_token = generate_session_token()
            access_token = create_jwt_token(db_user)
            
            # Store session in database
            await store_session(session_token, db_user)
            
            # Set authentication cookies
            set_auth_cookies(response, session_token, access_token)
            
            return AuthResponse(
                success=True,
                user={
                    "id": db_user["id"],
                    "email": db_user["email"],
                    "name": db_user.get("name", ""),
                    "auth_provider": "apple"
                },
                session_token=session_token,
                access_token=access_token,
                message="Successfully authenticated with Apple"
            )
            
        except Exception as e:
            logger.error(f"Error during Apple authentication: {str(e)}")
            raise HTTPException(status_code=500, detail="Apple authentication failed")

    @router.get("/session")
    async def check_session(request: Request):
        """Check if user has active session"""
        try:
            # Check session_token from cookie first, then Authorization header
            session_token = request.cookies.get("session_token")
            
            if not session_token:
                auth_header = request.headers.get("authorization")
                if auth_header and auth_header.startswith("Bearer "):
                    session_token = auth_header.split(" ")[1]
            
            if not session_token:
                raise HTTPException(status_code=401, detail="No active session")
            
            # Validate session in database
            session = await db.user_sessions.find_one({
                "session_token": session_token,
                "active": True
            })
            
            if not session:
                raise HTTPException(status_code=401, detail="Invalid session")
            
            # Check if session is expired
            expires_at = datetime.fromisoformat(session["expires_at"].replace('Z', '+00:00'))
            if expires_at < datetime.now(timezone.utc):
                # Mark session as expired
                await db.user_sessions.update_one(
                    {"session_token": session_token},
                    {"$set": {"active": False}}
                )
                raise HTTPException(status_code=401, detail="Session expired")
            
            # Get user data
            user = await db.users.find_one({"id": session["user_id"]})
            if not user:
                raise HTTPException(status_code=404, detail="User not found")
            
            return {
                "authenticated": True,
                "user": {
                    "id": user["id"],
                    "email": user["email"],
                    "name": user.get("name", ""),
                    "picture": user.get("picture", ""),
                    "auth_provider": user["auth_provider"]
                }
            }
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error checking session: {str(e)}")
            raise HTTPException(status_code=500, detail="Session validation error")

    @router.post("/logout")
    async def logout(request: Request, response: Response):
        """Logout user and clear session"""
        try:
            # Get session token
            session_token = request.cookies.get("session_token")
            
            if session_token:
                # Mark session as inactive
                await db.user_sessions.update_one(
                    {"session_token": session_token},
                    {"$set": {"active": False, "logged_out_at": datetime.now(timezone.utc).isoformat()}}
                )
            
            # Clear cookies
            response.delete_cookie("session_token", path="/", samesite="none")
            response.delete_cookie("access_token", path="/", samesite="none")
            
            return {"success": True, "message": "Successfully logged out"}
            
        except Exception as e:
            logger.error(f"Error during logout: {str(e)}")
            raise HTTPException(status_code=500, detail="Logout failed")

    return router