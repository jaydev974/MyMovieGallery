from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import (
    Badge,
    FeatureFlag,
    MovieCertification,
    Permission,
    Role,
    SystemSetting,
)


def build_genres() -> list[str]:
    return [
        "Action", "Adventure", "Animation", "Comedy", "Crime", "Documentary", "Drama",
        "Family", "Fantasy", "History", "Horror", "Music", "Mystery", "Romance",
        "Science Fiction", "Thriller", "War", "Western", "Biopic", "Noir",
    ]


def build_languages() -> list[tuple[str, str, str]]:
    return [
        ("en", "English", "English"),
        ("es", "Spanish", "Spanish"),
        ("fr", "French", "French"),
        ("de", "German", "German"),
        ("ja", "Japanese", "Japanese"),
        ("ko", "Korean", "Korean"),
        ("hi", "Hindi", "Hindi"),
        ("it", "Italian", "Italian"),
        ("pt", "Portuguese", "Portuguese"),
        ("zh", "Mandarin", "Mandarin"),
    ]


def build_countries() -> list[tuple[str, str]]:
    return [
        ("US", "United States"),
        ("GB", "United Kingdom"),
        ("CA", "Canada"),
        ("FR", "France"),
        ("DE", "Germany"),
        ("JP", "Japan"),
        ("KR", "South Korea"),
        ("IN", "India"),
        ("ES", "Spain"),
        ("IT", "Italy"),
    ]


def build_certifications() -> list[tuple[str, str, str, str]]:
    return [
        ("G", "General Audience", "US", "Suitable for all ages."),
        ("PG", "Parental Guidance", "US", "Parental guidance suggested."),
        ("PG-13", "Parents Strongly Cautioned", "US", "Some material may not be suitable for children."),
        ("R", "Restricted", "US", "Under 17 requires accompanying parent or adult guardian."),
        ("NC-17", "Adults Only", "US", "No one 17 and under admitted."),
        ("12A", "12A", "GB", "Children under 12 not admitted unless accompanied by an adult."),
        ("15", "15", "GB", "Only those 15 and older can watch."),
        ("18", "18", "GB", "Adults only."),
    ]


def build_roles() -> list[tuple[str, str, bool]]:
    return [
        ("super_admin", "Platform-wide administrative access with full control.", True),
        ("admin", "Operational management role for moderation and support.", False),
        ("moderator", "Moderation and content enforcement access.", False),
        ("member", "Standard user with personal library access.", False),
        ("premium", "Premium feature access and advanced recommendation tier.", False),
    ]


def build_permissions() -> list[tuple[str, str, str, str]]:
    return [
        ("View dashboard", "dashboard", "read", "Access the main dashboard overview."),
        ("Manage movies", "movies", "write", "Create, update, and delete movie metadata."),
        ("Moderate reviews", "reviews", "moderate", "Hide or flag abusive reviews."),
        ("Manage users", "users", "write", "Manage account state and permissions."),
        ("Access analytics", "analytics", "read", "Read aggregated analytics and metrics."),
        ("Export library", "library", "export", "Export personal movie collections."),
    ]


def build_system_settings() -> list[tuple[str, str, str, str, bool]]:
    return [
        ("site_name", "MyMovieGallery", "string", "Public-facing site name.", False),
        ("maintenance_mode", "false", "boolean", "Whether the platform is in maintenance mode.", False),
        ("max_library_exports_mb", "500", "integer", "Maximum user export size in MB.", False),
        ("recommendation_model_version", "v2", "string", "Current recommendation engine version.", False),
    ]


def build_feature_flags() -> list[tuple[str, bool, str, int]]:
    return [
        ("ai_recommendations", True, "Enable personalized AI recommendations.", 100),
        ("social_following", False, "Enable follower and friend features.", 15),
        ("movie_clubs", False, "Enable collaborative watch parties and clubs.", 5),
        ("export_import", True, "Allow library import/export flows.", 100),
    ]


async def seed_reference_data(session: AsyncSession) -> None:
    existing_roles = (await session.execute(select(Role))).scalars().all()
    if not existing_roles:
        for name, description, is_system in build_roles():
            session.add(Role(id=uuid.uuid4(), name=name, description=description, is_system=is_system))

    existing_permissions = (await session.execute(select(Permission))).scalars().all()
    if not existing_permissions:
        for name, resource, action, description in build_permissions():
            session.add(Permission(id=uuid.uuid4(), name=name, resource=resource, action=action, description=description))

    existing_certifications = (await session.execute(select(MovieCertification))).scalars().all()
    if not existing_certifications:
        for code, name, country_code, description in build_certifications():
            session.add(MovieCertification(id=uuid.uuid4(), code=code, name=name, country_code=country_code, description=description))

    existing_settings = (await session.execute(select(SystemSetting))).scalars().all()
    if not existing_settings:
        for key, value, value_type, description, is_encrypted in build_system_settings():
            session.add(SystemSetting(id=uuid.uuid4(), key=key, value=value, value_type=value_type, description=description, is_encrypted=is_encrypted))

    existing_flags = (await session.execute(select(FeatureFlag))).scalars().all()
    if not existing_flags:
        for name, enabled, description, rollout_percentage in build_feature_flags():
            session.add(FeatureFlag(id=uuid.uuid4(), name=name, enabled=enabled, description=description, rollout_percentage=rollout_percentage))

    existing_badges = (await session.execute(select(Badge))).scalars().all()
    if not existing_badges:
        badge_seed = [
            ("Movie Marathoner", "Watched 25 movies in a year.", ""),
            ("Critic", "Wrote 10 reviews.", ""),
            ("Collector", "Saved 50 favorites.", ""),
            ("Trendsetter", "Followed the latest recommendations.", ""),
        ]
        for name, description, icon_url in badge_seed:
            session.add(Badge(id=uuid.uuid4(), name=name, description=description, icon_url=icon_url))

    await session.commit()
