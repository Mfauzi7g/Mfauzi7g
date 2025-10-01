from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr, Field
from passlib.hash import bcrypt_sha256
from datetime import datetime, timedelta
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
import jwt
import os
from typing import Optional

# Security setup
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()
SECRET_KEY = os.getenv("JWT_SECRET", "your-secret-key-here")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30 * 24 * 60  # 30 days

# Pydantic models
class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)
    name: str = Field(..., min_length=2)

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(BaseModel):
    id: str
    email: str
    name: str
    subscription_status: str = "trial"
    created_at: datetime

class Token(BaseModel):
    access_token: str
    token_type: str
    user: User

# Helper functions
MAX_BCRYPT_PASSWORD_LEN = 72

def truncate_password(password: str) -> str:
    """Truncate password to 72 bytes for bcrypt compatibility"""
    encoded = password.encode('utf-8')[:MAX_BCRYPT_PASSWORD_LEN]
    return encoded.decode('utf-8', errors='ignore')

def verify_password(plain_password, hashed_password):
    safe_password = truncate_password(plain_password)
    return pwd_context.verify(safe_password, hashed_password)

def get_password_hash(password):
    safe_password = truncate_password(password)
    return pwd_context.hash(safe_password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def create_auth_router(db: AsyncIOMotorDatabase):
    router = APIRouter(prefix="/auth", tags=["authentication"])
    
    async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
        credentials_exception = HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
        try:
            payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
            user_id: str = payload.get("sub")
            if user_id is None:
                raise credentials_exception
        except jwt.PyJWTError:
            raise credentials_exception
        
        user = await db.users.find_one({"_id": ObjectId(user_id)})
        if user is None:
            raise credentials_exception
        return user
    
    @router.post("/register", response_model=Token)
    async def register(user_data: UserCreate):
        # Check if user already exists
        existing_user = await db.users.find_one({"email": user_data.email})
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        # Create new user
        user_dict = {
            "email": user_data.email,
            "password_hash": get_password_hash(user_data.password),
            "name": user_data.name,
            "subscription_status": "trial",
            "created_at": datetime.utcnow(),
            "trial_expires_at": datetime.utcnow() + timedelta(days=7)
        }
        
        result = await db.users.insert_one(user_dict)
        user_dict["_id"] = result.inserted_id
        
        # Generate token
        access_token = create_access_token(data={"sub": str(result.inserted_id)})
        
        user = User(
            id=str(result.inserted_id),
            email=user_dict["email"],
            name=user_dict["name"],
            subscription_status=user_dict["subscription_status"],
            created_at=user_dict["created_at"]
        )
        
        return Token(access_token=access_token, token_type="bearer", user=user)
    
    @router.post("/login", response_model=Token)
    async def login(login_data: UserLogin):
        user = await db.users.find_one({"email": login_data.email})
        if not user or not verify_password(login_data.password, user["password_hash"]):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password"
            )
        
        access_token = create_access_token(data={"sub": str(user["_id"])})
        
        user_obj = User(
            id=str(user["_id"]),
            email=user["email"],
            name=user["name"],
            subscription_status=user.get("subscription_status", "trial"),
            created_at=user["created_at"]
        )
        
        return Token(access_token=access_token, token_type="bearer", user=user_obj)
    
    @router.get("/me", response_model=User)
    async def get_current_user_info(current_user: dict = Depends(get_current_user)):
        return User(
            id=str(current_user["_id"]),
            email=current_user["email"],
            name=current_user["name"],
            subscription_status=current_user.get("subscription_status", "trial"),
            created_at=current_user["created_at"]
        )
    
    router.get_current_user = get_current_user  # Make it accessible to other routers
    return router