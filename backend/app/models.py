from __future__ import annotations

import uuid
from datetime import datetime
from enum import Enum

from sqlalchemy import (
    BigInteger,
    Boolean,
    CheckConstraint,
    Date,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    String,
    Text,
    Uuid,
    UniqueConstraint,
    func,
)
from sqlalchemy.types import JSON

UUID = Uuid
JSONB = JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class AuditMixin:
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    updated_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)


class UserRoleEnum(str, Enum):
    SUPER_ADMIN = "super_admin"
    ADMIN = "admin"
    MODERATOR = "moderator"
    MEMBER = "member"
    PREMIUM = "premium"


class OAuthProvider(str, Enum):
    GOOGLE = "google"
    GITHUB = "github"
    DISCORD = "discord"
    APPLE = "apple"
    CREDENTIALS = "credentials"


class ReviewStatus(str, Enum):
    DRAFT = "draft"
    PUBLISHED = "published"
    HIDDEN = "hidden"
    FLAGGED = "flagged"


class RecommendationSource(str, Enum):
    CONTENT_BASED = "content_based"
    COLLABORATIVE = "collaborative"
    HYBRID = "hybrid"
    POPULARITY = "popularity"
    TRENDING = "trending"


class NotificationType(str, Enum):
    SYSTEM = "system"
    RECOMMENDATION = "recommendation"
    REVIEW = "review"
    FOLLOW = "follow"
    ACHIEVEMENT = "achievement"
    WATCHLIST = "watchlist"
    EXPORT = "export"


class Role(Base):
    __tablename__ = "roles"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(80), unique=True, nullable=False)
    description: Mapped[str | None] = mapped_column(Text(), nullable=True)
    is_system: Mapped[bool] = mapped_column(Boolean(), nullable=False, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    users: Mapped[list[UserRole]] = relationship(back_populates="role")


class Permission(Base):
    __tablename__ = "permissions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(120), unique=True, nullable=False)
    resource: Mapped[str] = mapped_column(String(120), nullable=False)
    action: Mapped[str] = mapped_column(String(80), nullable=False)
    description: Mapped[str | None] = mapped_column(Text(), nullable=True)

    __table_args__ = (
        UniqueConstraint("resource", "action", name="uq_permissions_resource_action"),
        Index("ix_permissions_resource_action", "resource", "action"),
    )


class User(Base, AuditMixin):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    username: Mapped[str] = mapped_column(String(80), unique=True, index=True, nullable=False)
    full_name: Mapped[str | None] = mapped_column(String(180), nullable=True)
    bio: Mapped[str | None] = mapped_column(Text(), nullable=True)
    location: Mapped[str | None] = mapped_column(String(180), nullable=True)
    password_hash: Mapped[str | None] = mapped_column(String(255), nullable=True)
    avatar_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    # Private accounts expose only a minimal identity card to other users.
    is_private: Mapped[bool] = mapped_column(Boolean(), nullable=False, default=False, server_default="false")
    is_active: Mapped[bool] = mapped_column(Boolean(), nullable=False, default=True)
    is_verified: Mapped[bool] = mapped_column(Boolean(), nullable=False, default=False)
    is_superuser: Mapped[bool] = mapped_column(Boolean(), nullable=False, default=False)
    last_login_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    locale: Mapped[str] = mapped_column(String(10), nullable=False, default="en")
    timezone: Mapped[str] = mapped_column(String(80), nullable=False, default="UTC")
    marketing_opt_in: Mapped[bool] = mapped_column(Boolean(), nullable=False, default=False)
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    roles: Mapped[list[UserRole]] = relationship(back_populates="user")
    refresh_tokens: Mapped[list[RefreshToken]] = relationship(back_populates="user")
    oauth_accounts: Mapped[list[OAuthAccount]] = relationship(back_populates="user")
    sessions: Mapped[list[Session]] = relationship(back_populates="user")
    devices: Mapped[list[Device]] = relationship(back_populates="user")
    login_history: Mapped[list[LoginHistory]] = relationship(back_populates="user")
    ratings: Mapped[list[Rating]] = relationship(back_populates="user")
    reviews: Mapped[list[Review]] = relationship(back_populates="user")
    watchlists: Mapped[list[Watchlist]] = relationship(back_populates="user")
    favorites: Mapped[list[Favorite]] = relationship(back_populates="user")
    recommendations: Mapped[list[Recommendation]] = relationship(back_populates="user")
    user_preferences: Mapped[list[UserPreference]] = relationship(back_populates="user")
    notifications: Mapped[list[Notification]] = relationship(back_populates="user")
    notification_preferences: Mapped[list[NotificationPreference]] = relationship(back_populates="user")
    audit_logs: Mapped[list[AuditLog]] = relationship(back_populates="actor_user")


class UserRole(Base):
    __tablename__ = "user_roles"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    role_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("roles.id"), nullable=False)
    assigned_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    user: Mapped[User] = relationship(back_populates="roles")
    role: Mapped[Role] = relationship(back_populates="users")

    __table_args__ = (UniqueConstraint("user_id", "role_id", name="uq_user_roles_user_role"),)


class RefreshToken(Base):
    __tablename__ = "refresh_tokens"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    token_hash: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    replaced_by_token_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    user: Mapped[User] = relationship(back_populates="refresh_tokens")


class OAuthAccount(Base):
    __tablename__ = "oauth_accounts"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    provider: Mapped[str] = mapped_column(String(30), nullable=False)
    provider_user_id: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    access_token: Mapped[str | None] = mapped_column(Text(), nullable=True)
    refresh_token: Mapped[str | None] = mapped_column(Text(), nullable=True)
    token_expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    user: Mapped[User] = relationship(back_populates="oauth_accounts")

    __table_args__ = (UniqueConstraint("provider", "provider_user_id", name="uq_oauth_provider_user"),)


class EmailVerificationToken(Base):
    __tablename__ = "email_verification_tokens"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    token_hash: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    used_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class PasswordResetToken(Base):
    __tablename__ = "password_reset_tokens"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    token_hash: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    used_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class Session(Base):
    __tablename__ = "sessions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    token_hash: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    user_agent: Mapped[str | None] = mapped_column(Text(), nullable=True)
    ip_address: Mapped[str | None] = mapped_column(String(45), nullable=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    user: Mapped[User] = relationship(back_populates="sessions")


class Device(Base):
    __tablename__ = "devices"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    device_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    device_type: Mapped[str] = mapped_column(String(60), nullable=False)
    os: Mapped[str | None] = mapped_column(String(60), nullable=True)
    app_version: Mapped[str | None] = mapped_column(String(60), nullable=True)
    push_token: Mapped[str | None] = mapped_column(String(512), nullable=True)
    last_seen_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    user: Mapped[User] = relationship(back_populates="devices")


class LoginHistory(Base):
    __tablename__ = "login_history"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    user_agent: Mapped[str | None] = mapped_column(Text(), nullable=True)
    ip_address: Mapped[str | None] = mapped_column(String(45), nullable=True)
    succeeded: Mapped[bool] = mapped_column(Boolean(), nullable=False, default=True)
    failure_reason: Mapped[str | None] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    user: Mapped[User] = relationship(back_populates="login_history")


class Movie(Base, AuditMixin):
    __tablename__ = "movies"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    original_title: Mapped[str | None] = mapped_column(String(255), nullable=True)
    slug: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    overview: Mapped[str | None] = mapped_column(Text(), nullable=True)
    tagline: Mapped[str | None] = mapped_column(String(255), nullable=True)
    release_date: Mapped[Date | None] = mapped_column(Date(), nullable=True)
    runtime_minutes: Mapped[int | None] = mapped_column(Integer(), nullable=True)
    status: Mapped[str] = mapped_column(String(30), nullable=False, default="released")
    tmdb_id: Mapped[int | None] = mapped_column(Integer(), nullable=True, unique=True)
    imdb_id: Mapped[str | None] = mapped_column(String(20), nullable=True, unique=True)
    popularity_score: Mapped[float | None] = mapped_column(Numeric(10, 4), nullable=True)
    vote_average: Mapped[float | None] = mapped_column(Numeric(4, 2), nullable=True)
    vote_count: Mapped[int] = mapped_column(BigInteger(), nullable=False, default=0)
    revenue: Mapped[int | None] = mapped_column(BigInteger(), nullable=True)
    budget: Mapped[int | None] = mapped_column(BigInteger(), nullable=True)
    is_adult: Mapped[bool] = mapped_column(Boolean(), nullable=False, default=False)
    is_featured: Mapped[bool] = mapped_column(Boolean(), nullable=False, default=False)
    language_code: Mapped[str | None] = mapped_column(String(10), nullable=True)
    original_language: Mapped[str | None] = mapped_column(String(10), nullable=True)

    movie_metadata: Mapped[MovieMetadata | None] = relationship(back_populates="movie")
    genres: Mapped[list[MovieGenre]] = relationship(back_populates="movie")
    keywords: Mapped[list[MovieKeyword]] = relationship(back_populates="movie")
    images: Mapped[list[MovieImage]] = relationship(back_populates="movie")
    backdrops: Mapped[list[MovieBackdrop]] = relationship(back_populates="movie")
    videos: Mapped[list[MovieVideo]] = relationship(back_populates="movie")
    trailers: Mapped[list[MovieTrailer]] = relationship(back_populates="movie")
    cast_entries: Mapped[list[MovieCast]] = relationship(back_populates="movie")
    crew_entries: Mapped[list[MovieCrew]] = relationship(back_populates="movie")
    ratings: Mapped[list[Rating]] = relationship(back_populates="movie")
    reviews: Mapped[list[Review]] = relationship(back_populates="movie")
    watch_history: Mapped[list[WatchHistory]] = relationship(back_populates="movie")
    favorites: Mapped[list[Favorite]] = relationship(back_populates="movie")
    collection_movies: Mapped[list[CollectionMovie]] = relationship(back_populates="movie")
    similarities: Mapped[list[MovieSimilarity]] = relationship(
        back_populates="movie",
        foreign_keys="MovieSimilarity.movie_id",
    )
    recommendations: Mapped[list[Recommendation]] = relationship(back_populates="movie")

    __table_args__ = (
        Index("ix_movies_title_trgm", "title"),
        Index("ix_movies_release_date", "release_date"),
    )


class MovieMetadata(Base):
    __tablename__ = "movie_metadata"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    movie_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("movies.id"), unique=True, nullable=False)
    runtime_minutes: Mapped[int | None] = mapped_column(Integer(), nullable=True)
    budget: Mapped[int | None] = mapped_column(BigInteger(), nullable=True)
    revenue: Mapped[int | None] = mapped_column(BigInteger(), nullable=True)
    tagline: Mapped[str | None] = mapped_column(String(255), nullable=True)
    homepage: Mapped[str | None] = mapped_column(String(255), nullable=True)
    original_language: Mapped[str | None] = mapped_column(String(10), nullable=True)
    original_title: Mapped[str | None] = mapped_column(String(255), nullable=True)
    popularity: Mapped[float | None] = mapped_column(Numeric(10, 4), nullable=True)
    production_status: Mapped[str] = mapped_column(String(30), nullable=False, default="released")
    classification: Mapped[str | None] = mapped_column(String(30), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    movie: Mapped[Movie] = relationship(back_populates="movie_metadata")


class MovieImage(Base):
    __tablename__ = "movie_images"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    movie_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("movies.id"), nullable=False)
    image_type: Mapped[str] = mapped_column(String(40), nullable=False, default="poster")
    url: Mapped[str] = mapped_column(String(1024), nullable=False)
    width: Mapped[int | None] = mapped_column(Integer(), nullable=True)
    height: Mapped[int | None] = mapped_column(Integer(), nullable=True)
    is_primary: Mapped[bool] = mapped_column(Boolean(), nullable=False, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    movie: Mapped[Movie] = relationship(back_populates="images")

    __table_args__ = (Index("ix_movie_images_movie_primary", "movie_id", "is_primary"),)


class MovieBackdrop(Base):
    __tablename__ = "movie_backdrops"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    movie_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("movies.id"), nullable=False)
    url: Mapped[str] = mapped_column(String(1024), nullable=False)
    width: Mapped[int | None] = mapped_column(Integer(), nullable=True)
    height: Mapped[int | None] = mapped_column(Integer(), nullable=True)
    is_primary: Mapped[bool] = mapped_column(Boolean(), nullable=False, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    movie: Mapped[Movie] = relationship(back_populates="backdrops")


class MovieVideo(Base):
    __tablename__ = "movie_videos"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    movie_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("movies.id"), nullable=False)
    provider: Mapped[str] = mapped_column(String(30), nullable=False)
    provider_video_id: Mapped[str] = mapped_column(String(255), nullable=False)
    key: Mapped[str | None] = mapped_column(String(255), nullable=True)
    site: Mapped[str | None] = mapped_column(String(50), nullable=True)
    type: Mapped[str] = mapped_column(String(40), nullable=False)
    official: Mapped[bool] = mapped_column(Boolean(), nullable=False, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    movie: Mapped[Movie] = relationship(back_populates="videos")


class MovieTrailer(Base):
    __tablename__ = "movie_trailers"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    movie_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("movies.id"), nullable=False)
    url: Mapped[str] = mapped_column(String(1024), nullable=False)
    provider: Mapped[str] = mapped_column(String(30), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    movie: Mapped[Movie] = relationship(back_populates="trailers")


class MovieKeyword(Base):
    __tablename__ = "movie_keywords"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    movie_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("movies.id"), nullable=False)
    keyword: Mapped[str] = mapped_column(String(120), nullable=False)

    movie: Mapped[Movie] = relationship(back_populates="keywords")

    __table_args__ = (UniqueConstraint("movie_id", "keyword", name="uq_movie_keywords_movie_keyword"),)


class MovieGenre(Base):
    __tablename__ = "movie_genres"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    movie_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("movies.id"), nullable=False)
    genre_name: Mapped[str] = mapped_column(String(80), nullable=False)

    movie: Mapped[Movie] = relationship(back_populates="genres")

    __table_args__ = (UniqueConstraint("movie_id", "genre_name", name="uq_movie_genres_movie_name"),)


class MovieLanguage(Base):
    __tablename__ = "movie_languages"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    code: Mapped[str] = mapped_column(String(10), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    english_name: Mapped[str | None] = mapped_column(String(120), nullable=True)


class MovieCountry(Base):
    __tablename__ = "movie_countries"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    code: Mapped[str] = mapped_column(String(10), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(120), nullable=False)


class MovieCompany(Base):
    __tablename__ = "movie_companies"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    company_type: Mapped[str] = mapped_column(String(50), nullable=False, default="production")
    origin_country: Mapped[str | None] = mapped_column(String(10), nullable=True)
    logo_url: Mapped[str | None] = mapped_column(String(512), nullable=True)


class MovieCollection(Base):
    __tablename__ = "movie_collections"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(180), nullable=False)
    slug: Mapped[str] = mapped_column(String(180), unique=True, nullable=False)
    overview: Mapped[str | None] = mapped_column(Text(), nullable=True)
    poster_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class MovieReleaseDate(Base):
    __tablename__ = "movie_release_dates"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    movie_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("movies.id"), nullable=False)
    region: Mapped[str] = mapped_column(String(10), nullable=False)
    release_date: Mapped[Date] = mapped_column(Date(), nullable=False)
    certification: Mapped[str | None] = mapped_column(String(20), nullable=True)

    __table_args__ = (UniqueConstraint("movie_id", "region", "release_date", name="uq_movie_release_dates"),)


class MovieCertification(Base):
    __tablename__ = "movie_certifications"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    code: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    country_code: Mapped[str] = mapped_column(String(10), nullable=False)
    description: Mapped[str | None] = mapped_column(Text(), nullable=True)


class Actor(Base):
    __tablename__ = "actors"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(180), nullable=False, index=True)
    biography: Mapped[str | None] = mapped_column(Text(), nullable=True)
    birthday: Mapped[Date | None] = mapped_column(Date(), nullable=True)
    popularity: Mapped[float | None] = mapped_column(Numeric(10, 4), nullable=True)
    profile_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class Director(Base):
    __tablename__ = "directors"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(180), nullable=False, index=True)
    biography: Mapped[str | None] = mapped_column(Text(), nullable=True)
    birthday: Mapped[Date | None] = mapped_column(Date(), nullable=True)
    profile_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class Writer(Base):
    __tablename__ = "writers"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(180), nullable=False, index=True)
    biography: Mapped[str | None] = mapped_column(Text(), nullable=True)
    birthday: Mapped[Date | None] = mapped_column(Date(), nullable=True)
    profile_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class Producer(Base):
    __tablename__ = "producers"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(180), nullable=False, index=True)
    biography: Mapped[str | None] = mapped_column(Text(), nullable=True)
    birthday: Mapped[Date | None] = mapped_column(Date(), nullable=True)
    profile_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class MovieCast(Base):
    __tablename__ = "movie_cast"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    movie_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("movies.id"), nullable=False)
    actor_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("actors.id"), nullable=False)
    character_name: Mapped[str | None] = mapped_column(String(180), nullable=True)
    cast_order: Mapped[int] = mapped_column(Integer(), nullable=False, default=0)
    credit_id: Mapped[str | None] = mapped_column(String(80), nullable=True)

    movie: Mapped[Movie] = relationship(back_populates="cast_entries")

    __table_args__ = (UniqueConstraint("movie_id", "actor_id", "character_name", name="uq_movie_cast"),)


class MovieCrew(Base):
    __tablename__ = "movie_crew"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    movie_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("movies.id"), nullable=False)
    department: Mapped[str] = mapped_column(String(80), nullable=False)
    job: Mapped[str] = mapped_column(String(120), nullable=False)
    director_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("directors.id"), nullable=True)
    writer_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("writers.id"), nullable=True)
    producer_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("producers.id"), nullable=True)

    movie: Mapped[Movie] = relationship(back_populates="crew_entries")

    __table_args__ = (UniqueConstraint("movie_id", "department", "job", "director_id", "writer_id", "producer_id", name="uq_movie_crew"),)


class Rating(Base):
    __tablename__ = "ratings"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    movie_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("movies.id"), nullable=False)
    score: Mapped[int] = mapped_column(Integer(), nullable=False)
    source: Mapped[str] = mapped_column(String(40), nullable=False, default="user")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    user: Mapped[User] = relationship(back_populates="ratings")
    movie: Mapped[Movie] = relationship(back_populates="ratings")

    __table_args__ = (
        CheckConstraint("score >= 1 AND score <= 10", name="ck_ratings_score_range"),
        UniqueConstraint("user_id", "movie_id", name="uq_ratings_user_movie"),
        Index("ix_ratings_movie_score", "movie_id", "score"),
    )


class Review(Base):
    __tablename__ = "reviews"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    movie_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("movies.id"), nullable=False)
    title: Mapped[str | None] = mapped_column(String(255), nullable=True)
    body: Mapped[str] = mapped_column(Text(), nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="published")
    spoiler_flag: Mapped[bool] = mapped_column(Boolean(), nullable=False, default=False)
    is_spoiler: Mapped[bool] = mapped_column(Boolean(), nullable=False, default=False)
    like_count: Mapped[int] = mapped_column(Integer(), nullable=False, default=0)
    comment_count: Mapped[int] = mapped_column(Integer(), nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    user: Mapped[User] = relationship(back_populates="reviews")
    movie: Mapped[Movie] = relationship(back_populates="reviews")

    __table_args__ = (UniqueConstraint("user_id", "movie_id", name="uq_reviews_user_movie"),)


class ReviewLike(Base):
    __tablename__ = "review_likes"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    review_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("reviews.id"), nullable=False)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    __table_args__ = (UniqueConstraint("review_id", "user_id", name="uq_review_likes_review_user"),)


class ReviewComment(Base):
    __tablename__ = "review_comments"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    review_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("reviews.id"), nullable=False)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    parent_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("review_comments.id"), nullable=True)
    body: Mapped[str] = mapped_column(Text(), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)


class Favorite(Base):
    __tablename__ = "favorites"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    movie_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("movies.id"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    user: Mapped[User] = relationship(back_populates="favorites")
    movie: Mapped[Movie] = relationship(back_populates="favorites")

    __table_args__ = (UniqueConstraint("user_id", "movie_id", name="uq_favorites_user_movie"),)


class WatchHistory(Base):
    __tablename__ = "watch_history"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    movie_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("movies.id"), nullable=False)
    watched_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    progress_percent: Mapped[int] = mapped_column(Integer(), nullable=False, default=0)
    completed: Mapped[bool] = mapped_column(Boolean(), nullable=False, default=False)
    duration_minutes: Mapped[int | None] = mapped_column(Integer(), nullable=True)

    movie: Mapped[Movie] = relationship(back_populates="watch_history")

    __table_args__ = (
        Index("ix_watch_history_user_watched_at", "user_id", "watched_at"),
        Index("ix_watch_history_movie_watched_at", "movie_id", "watched_at"),
    )


class Watchlist(Base):
    __tablename__ = "watchlist"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(180), nullable=False, default="My Watchlist")
    description: Mapped[str | None] = mapped_column(Text(), nullable=True)
    is_public: Mapped[bool] = mapped_column(Boolean(), nullable=False, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    user: Mapped[User] = relationship(back_populates="watchlists")
    items: Mapped[list[WatchlistItem]] = relationship(back_populates="watchlist")


class WatchlistItem(Base):
    __tablename__ = "watchlist_items"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    watchlist_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("watchlist.id"), nullable=False)
    movie_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("movies.id"), nullable=False)
    priority: Mapped[int] = mapped_column(Integer(), nullable=False, default=0)
    added_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    notes: Mapped[str | None] = mapped_column(Text(), nullable=True)

    watchlist: Mapped[Watchlist] = relationship(back_populates="items")

    __table_args__ = (UniqueConstraint("watchlist_id", "movie_id", name="uq_watchlist_items_watchlist_movie"),)


class Collection(Base):
    __tablename__ = "collections"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(180), nullable=False)
    description: Mapped[str | None] = mapped_column(Text(), nullable=True)
    is_public: Mapped[bool] = mapped_column(Boolean(), nullable=False, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)


class CollectionMovie(Base):
    __tablename__ = "collection_movies"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    collection_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("collections.id"), nullable=False)
    movie_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("movies.id"), nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer(), nullable=False, default=0)
    added_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    movie: Mapped[Movie] = relationship(back_populates="collection_movies")

    __table_args__ = (UniqueConstraint("collection_id", "movie_id", name="uq_collection_movies"),)


class UserPreference(Base):
    __tablename__ = "user_preferences"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    preference_key: Mapped[str] = mapped_column(String(120), nullable=False)
    preference_value: Mapped[str | None] = mapped_column(Text(), nullable=True)
    value_type: Mapped[str] = mapped_column(String(40), nullable=False, default="string")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    user: Mapped[User] = relationship(back_populates="user_preferences")

    __table_args__ = (UniqueConstraint("user_id", "preference_key", name="uq_user_preferences"),)


class Notification(Base):
    __tablename__ = "notifications"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    notification_type: Mapped[str] = mapped_column(String(40), nullable=False)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    body: Mapped[str] = mapped_column(Text(), nullable=False)
    payload: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    is_read: Mapped[bool] = mapped_column(Boolean(), nullable=False, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    user: Mapped[User] = relationship(back_populates="notifications")


class NotificationPreference(Base):
    __tablename__ = "notification_preferences"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    category: Mapped[str] = mapped_column(String(60), nullable=False)
    email_enabled: Mapped[bool] = mapped_column(Boolean(), nullable=False, default=True)
    push_enabled: Mapped[bool] = mapped_column(Boolean(), nullable=False, default=True)
    sms_enabled: Mapped[bool] = mapped_column(Boolean(), nullable=False, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    user: Mapped[User] = relationship(back_populates="notification_preferences")

    __table_args__ = (UniqueConstraint("user_id", "category", name="uq_notification_preferences"),)


class Recommendation(Base):
    __tablename__ = "recommendations"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    movie_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("movies.id"), nullable=False)
    source: Mapped[str] = mapped_column(String(40), nullable=False, default="hybrid")
    score: Mapped[float] = mapped_column(Numeric(5, 4), nullable=False)
    reasons: Mapped[str | None] = mapped_column(Text(), nullable=True)
    model_version: Mapped[str] = mapped_column(String(80), nullable=False, default="v1")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    user: Mapped[User] = relationship(back_populates="recommendations")
    movie: Mapped[Movie] = relationship(back_populates="recommendations")

    __table_args__ = (UniqueConstraint("user_id", "movie_id", "model_version", name="uq_recommendations"),)


class RecommendationHistory(Base):
    __tablename__ = "recommendation_history"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    recommendation_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("recommendations.id"), nullable=True)
    action: Mapped[str] = mapped_column(String(40), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class MovieSimilarity(Base):
    __tablename__ = "movie_similarity"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    movie_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("movies.id"), nullable=False)
    similar_movie_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("movies.id"), nullable=False)
    similarity_score: Mapped[float] = mapped_column(Numeric(5, 4), nullable=False)
    algorithm: Mapped[str] = mapped_column(String(40), nullable=False, default="cosine")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    movie: Mapped[Movie] = relationship(back_populates="similarities", foreign_keys=[movie_id])

    __table_args__ = (UniqueConstraint("movie_id", "similar_movie_id", "algorithm", name="uq_movie_similarity"),)


class GenreSimilarity(Base):
    __tablename__ = "genre_similarity"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    genre_name: Mapped[str] = mapped_column(String(80), nullable=False)
    similar_genre_name: Mapped[str] = mapped_column(String(80), nullable=False)
    similarity_score: Mapped[float] = mapped_column(Numeric(5, 4), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class UserSimilarity(Base):
    __tablename__ = "user_similarity"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    similar_user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    similarity_score: Mapped[float] = mapped_column(Numeric(5, 4), nullable=False)
    algorithm: Mapped[str] = mapped_column(String(40), nullable=False, default="pearson")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    __table_args__ = (UniqueConstraint("user_id", "similar_user_id", "algorithm", name="uq_user_similarity"),)


class RecommendationFeedback(Base):
    __tablename__ = "recommendation_feedback"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    recommendation_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("recommendations.id"), nullable=False)
    feedback: Mapped[str] = mapped_column(String(20), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class DailyStatistic(Base):
    __tablename__ = "daily_statistics"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    stat_date: Mapped[Date] = mapped_column(Date(), nullable=False)
    total_users: Mapped[int] = mapped_column(Integer(), nullable=False, default=0)
    total_movies: Mapped[int] = mapped_column(Integer(), nullable=False, default=0)
    total_ratings: Mapped[int] = mapped_column(Integer(), nullable=False, default=0)
    total_reviews: Mapped[int] = mapped_column(Integer(), nullable=False, default=0)
    total_watch_hours: Mapped[int] = mapped_column(Integer(), nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    __table_args__ = (UniqueConstraint("stat_date", name="uq_daily_statistics_date"),)


class MonthlyStatistic(Base):
    __tablename__ = "monthly_statistics"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    year: Mapped[int] = mapped_column(Integer(), nullable=False)
    month: Mapped[int] = mapped_column(Integer(), nullable=False)
    total_users: Mapped[int] = mapped_column(Integer(), nullable=False, default=0)
    active_users: Mapped[int] = mapped_column(Integer(), nullable=False, default=0)
    total_ratings: Mapped[int] = mapped_column(Integer(), nullable=False, default=0)
    total_reviews: Mapped[int] = mapped_column(Integer(), nullable=False, default=0)
    total_recommendations: Mapped[int] = mapped_column(Integer(), nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    __table_args__ = (UniqueConstraint("year", "month", name="uq_monthly_statistics"),)


class UserStatistic(Base):
    __tablename__ = "user_statistics"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    total_movies_watched: Mapped[int] = mapped_column(Integer(), nullable=False, default=0)
    total_ratings: Mapped[int] = mapped_column(Integer(), nullable=False, default=0)
    total_reviews: Mapped[int] = mapped_column(Integer(), nullable=False, default=0)
    average_rating: Mapped[float | None] = mapped_column(Numeric(4, 2), nullable=True)
    favorite_genre: Mapped[str | None] = mapped_column(String(80), nullable=True)
    streak_days: Mapped[int] = mapped_column(Integer(), nullable=False, default=0)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    __table_args__ = (UniqueConstraint("user_id", name="uq_user_statistics_user"),)


class GenreStatistic(Base):
    __tablename__ = "genre_statistics"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    genre_name: Mapped[str] = mapped_column(String(80), nullable=False)
    total_views: Mapped[int] = mapped_column(Integer(), nullable=False, default=0)
    total_ratings: Mapped[int] = mapped_column(Integer(), nullable=False, default=0)
    average_rating: Mapped[float | None] = mapped_column(Numeric(4, 2), nullable=True)
    stat_month: Mapped[Date] = mapped_column(Date(), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    __table_args__ = (UniqueConstraint("genre_name", "stat_month", name="uq_genre_statistics"),)


class WatchTimeStatistic(Base):
    __tablename__ = "watch_time_statistics"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    stat_date: Mapped[Date] = mapped_column(Date(), nullable=False)
    total_minutes: Mapped[int] = mapped_column(Integer(), nullable=False, default=0)
    total_movies: Mapped[int] = mapped_column(Integer(), nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    __table_args__ = (UniqueConstraint("stat_date", "user_id", name="uq_watch_time_statistics"),)


class ActivityLog(Base):
    __tablename__ = "activity_logs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    entity_type: Mapped[str] = mapped_column(String(80), nullable=False)
    entity_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    action: Mapped[str] = mapped_column(String(80), nullable=False)
    details: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    ip_address: Mapped[str | None] = mapped_column(String(45), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    __table_args__ = (Index("ix_activity_logs_user_created_at", "user_id", "created_at"),)


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    actor_user_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    entity_type: Mapped[str] = mapped_column(String(80), nullable=False)
    entity_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    action: Mapped[str] = mapped_column(String(80), nullable=False)
    old_values: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    new_values: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    actor_user: Mapped[User | None] = relationship(back_populates="audit_logs")


class Badge(Base):
    __tablename__ = "badges"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(120), unique=True, nullable=False)
    description: Mapped[str | None] = mapped_column(Text(), nullable=True)
    icon_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class UserBadge(Base):
    __tablename__ = "user_badges"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    badge_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("badges.id"), nullable=False)
    awarded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    __table_args__ = (UniqueConstraint("user_id", "badge_id", name="uq_user_badges"),)


class Achievement(Base):
    __tablename__ = "achievements"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    code: Mapped[str] = mapped_column(String(80), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    description: Mapped[str | None] = mapped_column(Text(), nullable=True)
    threshold_value: Mapped[int | None] = mapped_column(Integer(), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class UserAchievement(Base):
    __tablename__ = "user_achievements"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    achievement_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("achievements.id"), nullable=False)
    unlocked_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    progress_value: Mapped[int] = mapped_column(Integer(), nullable=False, default=0)

    __table_args__ = (UniqueConstraint("user_id", "achievement_id", name="uq_user_achievements"),)


class SearchHistory(Base):
    __tablename__ = "search_history"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    query: Mapped[str] = mapped_column(String(255), nullable=False)
    result_count: Mapped[int] = mapped_column(Integer(), nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class SavedSearch(Base):
    __tablename__ = "saved_searches"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(160), nullable=False)
    filters: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class SystemSetting(Base):
    __tablename__ = "system_settings"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    key: Mapped[str] = mapped_column(String(120), unique=True, nullable=False)
    value: Mapped[str | None] = mapped_column(Text(), nullable=True)
    value_type: Mapped[str] = mapped_column(String(40), nullable=False, default="string")
    description: Mapped[str | None] = mapped_column(Text(), nullable=True)
    is_encrypted: Mapped[bool] = mapped_column(Boolean(), nullable=False, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)


class FeatureFlag(Base):
    __tablename__ = "feature_flags"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(120), unique=True, nullable=False)
    enabled: Mapped[bool] = mapped_column(Boolean(), nullable=False, default=False)
    description: Mapped[str | None] = mapped_column(Text(), nullable=True)
    rollout_percentage: Mapped[int] = mapped_column(Integer(), nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)


class ApiLog(Base):
    __tablename__ = "api_logs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    request_id: Mapped[str | None] = mapped_column(String(80), nullable=True)
    user_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    method: Mapped[str] = mapped_column(String(10), nullable=False)
    path: Mapped[str] = mapped_column(String(512), nullable=False)
    status_code: Mapped[int] = mapped_column(Integer(), nullable=False)
    latency_ms: Mapped[int | None] = mapped_column(Integer(), nullable=True)
    request_body: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    response_body: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    ip_address: Mapped[str | None] = mapped_column(String(45), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    __table_args__ = (Index("ix_api_logs_created_at", "created_at"),)


__all__ = [
    "ActivityLog",
    "Achievement",
    "Actor",
    "ApiLog",
    "AuditLog",
    "Badge",
    "Base",
    "Collection",
    "CollectionMovie",
    "DailyStatistic",
    "Device",
    "Director",
    "EmailVerificationToken",
    "Favorite",
    "FeatureFlag",
    "GenreSimilarity",
    "GenreStatistic",
    "LoginHistory",
    "Movie",
    "MovieBackdrop",
    "MovieCast",
    "MovieCertification",
    "MovieCollection",
    "MovieCompany",
    "MovieCountry",
    "MovieCrew",
    "MovieGenre",
    "MovieImage",
    "MovieKeyword",
    "MovieLanguage",
    "MovieMetadata",
    "MovieReleaseDate",
    "MovieSimilarity",
    "MovieTrailer",
    "MovieVideo",
    "MonthlyStatistic",
    "Notification",
    "NotificationPreference",
    "OAuthAccount",
    "PasswordResetToken",
    "Permission",
    "Producer",
    "Rating",
    "Recommendation",
    "RecommendationFeedback",
    "RecommendationHistory",
    "RefreshToken",
    "Review",
    "ReviewComment",
    "ReviewLike",
    "Role",
    "SavedSearch",
    "SearchHistory",
    "Session",
    "SystemSetting",
    "User",
    "UserAchievement",
    "UserBadge",
    "UserPreference",
    "UserRole",
    "UserSimilarity",
    "UserStatistic",
    "WatchHistory",
    "WatchTimeStatistic",
    "Watchlist",
    "WatchlistItem",
    "Writer",
]
