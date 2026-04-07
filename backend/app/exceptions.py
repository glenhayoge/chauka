"""
Global exception handlers for FastAPI.

Unhandled exceptions are logged with context and return a generic 500
response so internal details are never exposed to clients.
SQLAlchemy IntegrityError is mapped to a user-friendly 409 conflict message.
"""
import logging
import uuid

from fastapi import Request
from fastapi.responses import JSONResponse
from sqlalchemy.exc import IntegrityError

logger = logging.getLogger("chauka.api")


async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Catch-all for any unhandled exception in a request handler."""
    error_id = uuid.uuid4().hex[:8]
    logger.exception(
        "Unhandled exception [%s] %s %s | error_id=%s",
        request.method,
        request.url.path,
        type(exc).__name__,
        error_id,
        exc_info=exc,
    )
    return JSONResponse(
        status_code=500,
        content={
            "detail": "An unexpected error occurred. Please try again or contact support.",
            "error_id": error_id,
        },
    )


async def integrity_error_handler(request: Request, exc: IntegrityError) -> JSONResponse:
    """Map database constraint violations to a friendly 409 Conflict response."""
    logger.warning(
        "Integrity constraint violation [%s] %s | %s",
        request.method,
        request.url.path,
        exc.orig,
    )
    return JSONResponse(
        status_code=409,
        content={"detail": "This action conflicts with existing data. Please check your input and try again."},
    )
