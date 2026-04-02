"""
Simple in-memory rate limiter for auth endpoints.
For production, use Redis-backed slowapi or nginx rate limiting instead.
"""
import time
from collections import defaultdict
from threading import Lock

from fastapi import HTTPException, Request, status


class SimpleRateLimiter:
    def __init__(self, max_calls: int, period_seconds: int):
        self.max_calls = max_calls
        self.period = period_seconds
        self._calls: dict[str, list[float]] = defaultdict(list)
        self._lock = Lock()

    def is_allowed(self, key: str) -> bool:
        now = time.time()
        with self._lock:
            calls = self._calls[key]
            self._calls[key] = [t for t in calls if now - t < self.period]
            if len(self._calls[key]) >= self.max_calls:
                return False
            self._calls[key].append(now)
            return True


# 5 login attempts per minute per IP
auth_limiter = SimpleRateLimiter(max_calls=5, period_seconds=60)


def check_auth_rate_limit(request: Request) -> None:
    client_ip = request.client.host if request.client else "unknown"
    if not auth_limiter.is_allowed(client_ip):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many login attempts. Please wait before trying again.",
        )
