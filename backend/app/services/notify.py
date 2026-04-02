from sqlalchemy.ext.asyncio import AsyncSession

from app.models.notification import Notification


async def create_notification(
    db: AsyncSession,
    user_id: int,
    type: str,
    title: str,
    message: str,
    link: str | None = None,
) -> Notification:
    """Create a notification for a user.

    This utility is intended to be called by other services whenever
    they need to alert a user (e.g. a milestone is due, a new comment
    was posted, an invitation was received).
    """
    notification = Notification(
        user_id=user_id,
        type=type,
        title=title,
        message=message,
        link=link,
    )
    db.add(notification)
    await db.commit()
    await db.refresh(notification)
    return notification
