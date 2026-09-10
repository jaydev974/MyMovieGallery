from __future__ import annotations

from fastapi import Request
from slowapi import Limiter


def _rate_limit_key(request: Request) -> str:
    forwarded_for = request.headers.get("x-forwarded-for")
    if forwarded_for:
        return forwarded_for.split(",", 1)[0].strip()
    if request.client and request.client.host:
        return request.client.host
    return "anonymous"


limiter = Limiter(key_func=_rate_limit_key, default_limits=[])
