// ─── Movie Types ───────────────────────────────────────────────────────────────
export type MovieStatus = 'watched' | 'watching' | 'plan_to_watch' | 'dropped';

export interface CastMember {
  id: number;
  name: string;
  character: string;
  profilePath?: string;
}

export interface Movie {
  id: number;
  title: string;
  year: number;
  genre: string[];
  overview: string;
  director: string;
  cast: CastMember[];
  runtime: number; // minutes
  language: string;
  country: string;
  imdbRating: number;
  rottenTomatoes: number;
  posterColor: string; // gradient CSS for placeholder
  accentColor: string;
  backdropColor: string;
  status?: MovieStatus;
  userRating?: number;
  watchedDate?: string;
  isFavorite?: boolean;
  isInWatchlist?: boolean;
  watchlistPriority?: number;
  expectedWatchDate?: string;
  decade: number;
  popularity: number; // 0-100
  awards?: string[];
  budget?: number;
  boxOffice?: number;
  trailerUrl?: string;
  streamingOn?: string[];
  posterUrl?: string;
  backdropUrl?: string;
}

// ─── User Types ────────────────────────────────────────────────────────────────
export interface User {
  id: string;
  name: string;
  email: string;
  username: string;
  bio: string;
  avatarUrl?: string;
  avatarColor: string;
  favoriteGenre: string;
  favoriteActor: string;
  favoriteDirector: string;
  joinedDate: string;
  location?: string;
  website?: string;
  achievements: Achievement[];
  watchStreak: number;
  totalWatched: number;
  totalReviews: number;
  totalRatings: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  earnedAt: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

// ─── Review Types ──────────────────────────────────────────────────────────────
export interface Review {
  id: string;
  movieId: number;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  title: string;
  content: string;
  likes: number;
  isLiked?: boolean;
  createdAt: string;
  updatedAt?: string;
  containsSpoilers: boolean;
  tags: string[];
}

// ─── Theme Types ───────────────────────────────────────────────────────────────
export type ThemeName =
  | 'hollywood-dark'
  | 'midnight-noir'
  | 'oscar-gold'
  | 'neon-hollywood'
  | 'classic-cinema';

export interface ThemeConfig {
  name: ThemeName;
  label: string;
  description: string;
  preview: string; // gradient for preview swatch
  colors: {
    background: string;
    backgroundSecondary: string;
    card: string;
    cardSecondary: string;
    accent: string;
    accentSecondary: string;
    text: string;
    textSecondary: string;
    textMuted: string;
    border: string;
    glow: string;
    navbar: string;
    sidebar: string;
    success: string;
    warning: string;
    danger: string;
  };
}

// ─── Analytics Types ───────────────────────────────────────────────────────────
export interface MonthlyActivity {
  month: string;
  watched: number;
  reviewed: number;
  hours: number;
}

export interface GenreDistribution {
  genre: string;
  count: number;
  percentage: number;
  color: string;
}

export interface RatingDistribution {
  rating: string;
  count: number;
}

export interface DecadeData {
  decade: string;
  count: number;
}

// ─── Recommendation Types ──────────────────────────────────────────────────────
export interface Recommendation {
  movie: Movie;
  confidence: number; // 0-100
  similarity: number; // 0-100
  reasons: RecommendationReason[];
  genreOverlap: string[];
}

export interface RecommendationReason {
  type: 'similar_movie' | 'same_director' | 'same_genre' | 'cast_overlap' | 'trending';
  label: string;
  relatedMovieTitle?: string;
}

// ─── UI State Types ────────────────────────────────────────────────────────────
export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message?: string;
  duration?: number;
}

export interface FilterState {
  genres: string[];
  yearRange: [number, number];
  ratingRange: [number, number];
  languages: string[];
  status: MovieStatus | 'all';
  sortBy: 'title' | 'year' | 'rating' | 'imdb' | 'watched_date' | 'popularity';
  sortOrder: 'asc' | 'desc';
  search: string;
}
