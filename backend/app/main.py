import logging
import os
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy.exc import IntegrityError

from app.auth.router import router as auth_router
from app.exceptions import integrity_error_handler, unhandled_exception_handler
from app.config import settings
from app.database import create_tables
import app.models  # noqa: F401 - ensure models registered before create_tables
from app.routers.activities import router as activities_router
from app.routers.assumptions import router as assumptions_router
from app.routers.budget import router as budget_router
from app.routers.columns import router as columns_router
from app.routers.dataentries import router as dataentries_router
from app.routers.exports import router as exports_router
from app.routers.indicators import router as indicators_router
from app.routers.logframes import router as logframes_router
from app.routers.periods import router as periods_router
from app.routers.ratings import router as ratings_router
from app.routers.results import router as results_router
from app.routers.settings import router as settings_router
from app.routers.subindicators import router as subindicators_router
from app.routers.tags import router as tags_router
from app.routers.statusupdates import router as statusupdates_router
from app.routers.talines import router as talines_router
from app.routers.targets import router as targets_router
from app.routers.expenses import router as expenses_router
from app.routers.resources import router as resources_router
from app.routers.users import router as users_router
from app.routers.kobo import router as kobo_router
from app.routers.gsheets import router as gsheets_router
from app.routers.organisations import router as organisations_router
from app.routers.programs import router as programs_router
from app.routers.projects import router as projects_router
from app.routers.memberships import router as memberships_router
from app.routers.project_roles import router as project_roles_router
from app.routers.invitations import router as invitations_router
from app.routers.notifications import router as notifications_router
from app.routers.audit import router as audit_router
from app.routers.admin_dashboard import router as admin_dashboard_router
from app.routers.admin_users import router as admin_users_router
from app.routers.admin_orgs import router as admin_orgs_router
from app.routers.admin_rbac import router as admin_rbac_router
from app.routers.disaggregation import router as disaggregation_router
from app.routers.analytics import router as analytics_router
from app.routers.indicator_library import router as indicator_library_router
from app.security.headers import SecurityHeadersMiddleware

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s | %(message)s",
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    await create_tables()
    yield


app = FastAPI(
    title="Chauka API",
    description="Logframe management API",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_exception_handler(Exception, unhandled_exception_handler)
app.add_exception_handler(IntegrityError, integrity_error_handler)

app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(organisations_router)
app.include_router(programs_router)
app.include_router(projects_router)
app.include_router(memberships_router)
app.include_router(project_roles_router)
app.include_router(invitations_router)
app.include_router(logframes_router)
app.include_router(results_router)
app.include_router(indicators_router)
app.include_router(subindicators_router)
app.include_router(activities_router)
app.include_router(columns_router)
app.include_router(dataentries_router)
app.include_router(exports_router)
app.include_router(expenses_router)
app.include_router(resources_router)
app.include_router(notifications_router)
app.include_router(audit_router)
app.include_router(assumptions_router)
app.include_router(budget_router)
app.include_router(tags_router)
app.include_router(periods_router)
app.include_router(ratings_router)
app.include_router(settings_router)
app.include_router(targets_router)
app.include_router(statusupdates_router)
app.include_router(talines_router)
app.include_router(users_router)
app.include_router(kobo_router)
app.include_router(gsheets_router)

# Admin portal routers
app.include_router(admin_dashboard_router)
app.include_router(admin_users_router)
app.include_router(admin_orgs_router)
app.include_router(admin_rbac_router)
app.include_router(disaggregation_router)
app.include_router(analytics_router)
app.include_router(indicator_library_router)


@app.get("/health")
async def health():
    return {"status": "ok"}


# --- Serve React SPA (single-image deploy) -----------------------------------
# Resolve frontend/dist relative to the backend package root.
# In the Docker image: /app/backend/../frontend/dist  =  /app/frontend/dist
_FRONTEND_DIST = Path(__file__).parent.parent.parent / "frontend" / "dist"

if _FRONTEND_DIST.is_dir():
    # Serve compiled JS/CSS/images from /assets
    app.mount("/assets", StaticFiles(directory=_FRONTEND_DIST / "assets"), name="assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    async def spa_fallback(full_path: str):
        """Return index.html for all unmatched routes (client-side routing)."""
        index = _FRONTEND_DIST / "index.html"
        return FileResponse(index)
