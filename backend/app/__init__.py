"""MyMovieGallery backend package."""

from . import auth_request_patch  # noqa: F401
from . import refresh_token_patch  # noqa: F401

__all__ = ["app"]
