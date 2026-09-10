from __future__ import annotations

from app.auth import LoginRequest, RegisterRequest


def _patch_model(model: type) -> None:
    if "remember_me" in getattr(model, "__annotations__", {}):
        return

    annotations = dict(getattr(model, "__annotations__", {}))
    annotations["remember_me"] = bool
    model.__annotations__ = annotations
    setattr(model, "remember_me", False)
    model.model_rebuild(force=True)


_patch_model(LoginRequest)
_patch_model(RegisterRequest)
