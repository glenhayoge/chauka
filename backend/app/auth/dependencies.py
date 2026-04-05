from fastapi import Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.utils import decode_token
from app.database import get_db
from app.models.contacts import User
from app.services.rbac import can_edit_logframe

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/token")


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = decode_token(token)
        username: str | None = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    result = await db.execute(select(User).where(User.username == username))
    user = result.scalar_one_or_none()
    if user is None or not user.is_active:
        raise credentials_exception
    return user


async def require_editor(
    current_user: User = Depends(get_current_user),
) -> User:
    """Require user to be staff/superuser. Matches Django CanEditOrReadOnly.

    This is the legacy check -- used by endpoints that don't have a
    logframe_id in the path. For logframe-scoped checks, use
    require_logframe_editor instead.
    """
    if current_user.is_superuser or current_user.is_staff:
        return current_user
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="You do not have permission to edit this logframe.",
    )


async def require_logframe_editor(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> User:
    """Check project-level roles when logframe_id is in the route.

    Falls back to is_staff/is_superuser for backward compatibility.
    """
    logframe_id = request.path_params.get("logframe_id")
    if logframe_id is not None:
        logframe_id = int(logframe_id)
        if await can_edit_logframe(current_user, logframe_id, db):
            return current_user
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to edit this logframe.",
        )

    # No logframe_id in route -- fall back to legacy check
    if current_user.is_superuser or current_user.is_staff:
        return current_user
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="You do not have permission to edit this logframe.",
    )


async def require_superuser(
    current_user: User = Depends(get_current_user),
) -> User:
    """Require user to be a platform superuser or staff."""
    if current_user.is_superuser or current_user.is_staff:
        return current_user
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Platform admin access required.",
    )


async def require_org_admin(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> User:
    """Require user to be an org admin or superuser/staff."""
    from app.services.rbac import is_org_admin

    if current_user.is_superuser or current_user.is_staff:
        return current_user

    organisation_id = request.path_params.get("organisation_id")
    if organisation_id is not None:
        organisation_id = int(organisation_id)
        if await is_org_admin(current_user.id, organisation_id, db):
            return current_user

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="You must be an organisation admin to perform this action.",
    )
