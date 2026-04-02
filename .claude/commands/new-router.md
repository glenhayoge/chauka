# /new-router — Add a FastAPI router for a new resource

Quickly scaffold a **backend-only** router, schema, and model for a new API resource.

## Usage
```
/new-router <resource-name>
```
Example: `/new-router actuals` or `/new-router status-updates`

## Steps

### 1. Create the model
File: `backend/app/models/<resource>.py`

```python
from sqlalchemy import Integer, String, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base

class <Resource>(Base):
    __tablename__ = "logframe_<resource>"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    logframe_id: Mapped[int] = mapped_column(ForeignKey("logframe_logframe.id"), nullable=False)
    # add domain fields here
```

Then add to `backend/app/models/__init__.py`:
```python
from app.models.<resource> import <Resource>  # noqa: F401
```

### 2. Create schemas
File: `backend/app/schemas/<resource>.py`

```python
from pydantic import BaseModel, ConfigDict

class <Resource>Base(BaseModel):
    # shared fields

class <Resource>Create(<Resource>Base):
    pass

class <Resource>Update(<Resource>Base):
    # all fields Optional

class <Resource>Read(<Resource>Base):
    id: int
    model_config = ConfigDict(from_attributes=True)
```

### 3. Create router
File: `backend/app/routers/<resources>.py`

```python
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.auth.dependencies import get_current_user
from app.models.<resource> import <Resource>
from app.schemas.<resource> import <Resource>Create, <Resource>Update, <Resource>Read

router = APIRouter(
    prefix="/api/logframes/{logframe_id}/<resources>",
    tags=["<resources>"],
)

@router.get("/", response_model=list[<Resource>Read])
async def list_<resources>(logframe_id: int, db: AsyncSession = Depends(get_db), _=Depends(get_current_user)):
    result = await db.execute(select(<Resource>).where(<Resource>.logframe_id == logframe_id))
    return result.scalars().all()
```

### 4. Register in main.py
Add to `backend/app/main.py`:
```python
from app.routers.<resources> import router as <resources>_router
# ...
app.include_router(<resources>_router)
```

### 5. Generate migration
```bash
cd backend
alembic revision --autogenerate -m "add <resource>"
alembic upgrade head
```
