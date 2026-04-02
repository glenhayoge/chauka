from datetime import datetime

from pydantic import BaseModel, ConfigDict


class NotificationRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    type: str
    title: str
    message: str
    link: str | None = None
    read: bool = False
    created_at: datetime


class NotificationUpdate(BaseModel):
    read: bool = True
