"""MyMovieGallery backend package."""

from .refresh_token_patch import patch_refresh_token_model

patch_refresh_token_model()

__all__ = ["app"]
