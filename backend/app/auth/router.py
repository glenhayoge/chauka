import hashlib
import secrets
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.auth.utils import create_access_token, get_password_hash, verify_password
from app.database import get_db
from app.models.contacts import User
from app.security.rate_limit import check_auth_rate_limit

router = APIRouter(prefix="/api/auth", tags=["auth"])

PASSWORD_RESET_EXPIRY_HOURS = 1


def _hash_token(token: str) -> str:
    """Hash a reset token with SHA-256 before storing or comparing."""
    return hashlib.sha256(token.encode()).hexdigest()


class Token(BaseModel):
    access_token: str
    token_type: str
    user_id: int
    username: str
    is_staff: bool


class RegisterRequest(BaseModel):
    username: str
    password: str
    email: str = ""
    first_name: str = ""
    last_name: str = ""


class ForgotPasswordRequest(BaseModel):
    email: str


class ForgotPasswordResponse(BaseModel):
    message: str
    reset_link: str | None = None


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str


class UserProfileResponse(BaseModel):
    id: int
    username: str
    first_name: str
    last_name: str
    email: str
    is_staff: bool

    model_config = {"from_attributes": True}


class UpdateProfileRequest(BaseModel):
    first_name: str | None = None
    last_name: str | None = None
    email: str | None = None


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


# ---------------------------------------------------------------------------
# Login & Register
# ---------------------------------------------------------------------------


@router.post("/token", response_model=Token)
async def login(
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db),
):
    check_auth_rate_limit(request)
    result = await db.execute(select(User).where(User.username == form_data.username))
    user = result.scalar_one_or_none()
    if not user or not verify_password(form_data.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = create_access_token({"sub": user.username})
    return Token(
        access_token=token,
        token_type="bearer",
        user_id=user.id,
        username=user.username,
        is_staff=user.is_staff or user.is_superuser,
    )


@router.post("/register", response_model=Token, status_code=201)
async def register(
    request: Request,
    body: RegisterRequest,
    db: AsyncSession = Depends(get_db),
):
    """Register a new user account and return a login token."""
    check_auth_rate_limit(request)
    # Check username not taken
    existing = await db.execute(select(User).where(User.username == body.username))
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Username already taken",
        )
    user = User(
        username=body.username,
        password=get_password_hash(body.password),
        email=body.email,
        first_name=body.first_name,
        last_name=body.last_name,
        is_staff=False,
        is_superuser=False,
        is_active=True,
        date_joined=datetime.now(timezone.utc).isoformat(),
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    token = create_access_token({"sub": user.username})
    return Token(
        access_token=token,
        token_type="bearer",
        user_id=user.id,
        username=user.username,
        is_staff=False,
    )


# ---------------------------------------------------------------------------
# Password Reset (Issue #36)
# ---------------------------------------------------------------------------


@router.post("/forgot-password", response_model=ForgotPasswordResponse)
async def forgot_password(
    request: Request,
    body: ForgotPasswordRequest,
    db: AsyncSession = Depends(get_db),
):
    """Generate a password reset token for the given email address.

    MVP: returns the reset link directly in the response instead of sending
    an email (small pilot user base).
    """
    check_auth_rate_limit(request)
    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()

    if not user:
        # Do not reveal whether the email exists
        return ForgotPasswordResponse(
            message="If an account with that email exists, a reset link has been generated."
        )

    token = secrets.token_urlsafe(48)
    expires = datetime.now(timezone.utc) + timedelta(hours=PASSWORD_RESET_EXPIRY_HOURS)

    user.password_reset_token = _hash_token(token)
    user.password_reset_expires = expires.isoformat()
    await db.commit()

    # Build reset link relative to the request origin
    origin = request.headers.get("origin", "")
    reset_link = f"{origin}/reset-password/{token}"

    return ForgotPasswordResponse(
        message="If an account with that email exists, a reset link has been generated.",
        reset_link=reset_link,
    )


@router.get("/verify-reset-token/{token}")
async def verify_reset_token(
    token: str,
    db: AsyncSession = Depends(get_db),
):
    """Validate that a password reset token is still valid."""
    user = await _get_user_by_reset_token(token, db)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token",
        )
    return {"valid": True}


@router.post("/reset-password")
async def reset_password(
    body: ResetPasswordRequest,
    db: AsyncSession = Depends(get_db),
):
    """Reset the user's password using a valid reset token."""
    user = await _get_user_by_reset_token(body.token, db)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token",
        )

    if len(body.new_password) < 8:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Password must be at least 8 characters",
        )

    user.password = get_password_hash(body.new_password)
    user.password_reset_token = None
    user.password_reset_expires = None
    await db.commit()

    return {"message": "Password has been reset successfully"}


async def _get_user_by_reset_token(token: str, db: AsyncSession) -> User | None:
    """Look up a user by reset token, returning None if expired or missing."""
    hashed = _hash_token(token)
    result = await db.execute(
        select(User).where(User.password_reset_token == hashed)
    )
    user = result.scalar_one_or_none()
    if not user or not user.password_reset_expires:
        return None

    expires = datetime.fromisoformat(user.password_reset_expires)
    if expires.tzinfo is None:
        expires = expires.replace(tzinfo=timezone.utc)
    if datetime.now(timezone.utc) > expires:
        return None

    return user


# ---------------------------------------------------------------------------
# User Profile (Issue #37)
# ---------------------------------------------------------------------------


@router.get("/me", response_model=UserProfileResponse)
async def get_profile(
    current_user: User = Depends(get_current_user),
):
    """Return the authenticated user's profile."""
    return UserProfileResponse(
        id=current_user.id,
        username=current_user.username,
        first_name=current_user.first_name,
        last_name=current_user.last_name,
        email=current_user.email,
        is_staff=current_user.is_staff or current_user.is_superuser,
    )


@router.patch("/me", response_model=UserProfileResponse)
async def update_profile(
    body: UpdateProfileRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update the authenticated user's profile fields."""
    if body.first_name is not None:
        current_user.first_name = body.first_name
    if body.last_name is not None:
        current_user.last_name = body.last_name
    if body.email is not None:
        current_user.email = body.email
    await db.commit()
    await db.refresh(current_user)

    return UserProfileResponse(
        id=current_user.id,
        username=current_user.username,
        first_name=current_user.first_name,
        last_name=current_user.last_name,
        email=current_user.email,
        is_staff=current_user.is_staff or current_user.is_superuser,
    )


@router.post("/change-password")
async def change_password(
    body: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Change the authenticated user's password."""
    if not verify_password(body.current_password, current_user.password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect",
        )

    if len(body.new_password) < 8:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Password must be at least 8 characters",
        )

    current_user.password = get_password_hash(body.new_password)
    await db.commit()

    return {"message": "Password changed successfully"}
