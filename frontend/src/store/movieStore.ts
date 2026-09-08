import { create } from 'zustand';
import type { Movie, Review, FilterState } from '../types';
import { api } from '../api/client';

interface ApiMovie { id: string; title: string; year: number | null; overview: string | null; genres: string[]; status: string; vote_average: number | null; runtime_minutes?: number | null }
interface ApiReview { id: string; movie_id: string; user_id: string; username: string; title: string | null; body: string; rating: number; like_count: number; is_spoiler: boolean; created_at: string; updated_at: string }
interface ApiLibrary { watchlist: ApiMovie[]; favorites: ApiMovie[]; watched: ApiMovie[]; rated: ApiMovie[] }

interface MovieState {
  movies: Movie[]; reviews: Review[]; filter: FilterState; isLoading: boolean; error: string | null;
  loadMovies: () => Promise<void>; loadReviews: () => Promise<void>;
  addMovie: (movie: Movie) => void; updateMovie: (id: number, updates: Partial<Movie>) => void; removeMovie: (id: number) => void;
  toggleFavorite: (id: number) => Promise<void>; toggleWatchlist: (id: number) => Promise<void>; rateMovie: (id: number, rating: number) => Promise<void>; markWatched: (id: number, date?: string) => Promise<void>;
  addReview: (review: Review) => Promise<void>; updateReview: (id: string, updates: Partial<Review>) => void; deleteReview: (id: string) => Promise<void>; likeReview: (id: string) => Promise<void>;
  setFilter: (filter: Partial<FilterState>) => void; resetFilter: () => void;
  getWatchedMovies: () => Movie[]; getWatchlistMovies: () => Movie[]; getFavoriteMovies: () => Movie[]; getFilteredMovies: () => Movie[]; getMovieById: (id: number) => Movie | undefined; getReviewsForMovie: (movieId: number) => Review[];
}

const defaultFilter: FilterState = { genres: [], yearRange: [1920, 2026], ratingRange: [0, 10], languages: [], status: 'all', sortBy: 'popularity', sortOrder: 'desc', search: '' };

function mapMovie(movie: ApiMovie, index: number, library?: ApiLibrary): Movie {
  const inList = (items: ApiMovie[]) => items.some((item) => item.id === movie.id);
  const year = movie.year || 0;
  return {
    id: index + 1, backendId: movie.id, title: movie.title, year, genre: movie.genres, overview: movie.overview || '', director: 'Unknown', cast: [], runtime: movie.runtime_minutes || 0,
    language: 'English', country: 'USA', imdbRating: movie.vote_average || 0, rottenTomatoes: 0, posterColor: 'linear-gradient(145deg, #172033, #334155)', accentColor: '#fbbf24', backdropColor: 'linear-gradient(135deg, #172033, #0f172a)',
    status: inList(library?.watched || []) ? 'watched' : inList(library?.watchlist || []) ? 'plan_to_watch' : undefined, userRating: undefined, isFavorite: inList(library?.favorites || []), isInWatchlist: inList(library?.watchlist || []), decade: Math.floor(year / 10) * 10, popularity: movie.vote_average || 0,
  };
}

function mapReview(review: ApiReview, movies: Movie[]): Review {
  return { id: review.id, movieId: movies.find((movie) => movie.backendId === review.movie_id)?.id || 0, backendMovieId: review.movie_id, userId: review.user_id, userName: review.username, rating: review.rating, title: review.title || '', content: review.body, likes: review.like_count, createdAt: review.created_at, updatedAt: review.updated_at, containsSpoilers: review.is_spoiler, tags: [] };
}

export const useMovieStore = create<MovieState>()((set, get) => ({
  movies: [], reviews: [], filter: defaultFilter, isLoading: false, error: null,
  loadMovies: async () => {
    set({ isLoading: true, error: null });
    try {
      const [movies, library] = await Promise.all([api.get<ApiMovie[]>('/api/movies?limit=100'), api.get<ApiLibrary>('/api/library')]);
      set({ movies: movies.map((movie, index) => mapMovie(movie, index, library)), isLoading: false });
    } catch (error) { set({ isLoading: false, error: error instanceof Error ? error.message : 'Unable to load movies' }); }
  },
  loadReviews: async () => {
    try { const reviews = await api.get<ApiReview[]>('/api/reviews'); set({ reviews: reviews.map((review) => mapReview(review, get().movies)) }); }
    catch (error) { set({ error: error instanceof Error ? error.message : 'Unable to load reviews' }); }
  },
  addMovie: (movie) => set((state) => ({ movies: [...state.movies, movie] })),
  updateMovie: (id, updates) => set((state) => ({ movies: state.movies.map((movie) => movie.id === id ? { ...movie, ...updates } : movie) })),
  removeMovie: (id) => set((state) => ({ movies: state.movies.filter((movie) => movie.id !== id) })),
  toggleFavorite: async (id) => {
    const movie = get().movies.find((item) => item.id === id); if (!movie?.backendId) return;
    if (movie.isFavorite) await api.delete(`/api/movies/${movie.backendId}/favorite`); else await api.post(`/api/movies/${movie.backendId}/favorite`);
    set((state) => ({ movies: state.movies.map((item) => item.id === id ? { ...item, isFavorite: !item.isFavorite } : item) }));
  },
  toggleWatchlist: async (id) => {
    const movie = get().movies.find((item) => item.id === id); if (!movie?.backendId) return;
    if (movie.isInWatchlist) await api.delete(`/api/movies/${movie.backendId}/watchlist`); else await api.post(`/api/movies/${movie.backendId}/watchlist`);
    set((state) => ({ movies: state.movies.map((item) => item.id === id ? { ...item, isInWatchlist: !item.isInWatchlist, status: item.isInWatchlist ? undefined : 'plan_to_watch' } : item) }));
  },
  rateMovie: async (id, rating) => {
    const movie = get().movies.find((item) => item.id === id); if (!movie?.backendId) return; await api.put(`/api/movies/${movie.backendId}/rating`, { score: rating });
    set((state) => ({ movies: state.movies.map((item) => item.id === id ? { ...item, userRating: rating } : item) }));
  },
  markWatched: async (id, date) => {
    const movie = get().movies.find((item) => item.id === id); if (!movie?.backendId) return; await api.post(`/api/movies/${movie.backendId}/watched`);
    set((state) => ({ movies: state.movies.map((item) => item.id === id ? { ...item, status: 'watched', watchedDate: date || new Date().toISOString().split('T')[0] } : item) }));
  },
  addReview: async (review) => {
    const movie = get().movies.find((item) => item.id === review.movieId); if (!movie?.backendId) return;
    const saved = await api.post<ApiReview>(`/api/movies/${movie.backendId}/reviews`, { title: review.title, body: review.content, rating: review.rating, is_spoiler: review.containsSpoilers });
    set((state) => ({ reviews: [mapReview(saved, state.movies), ...state.reviews] }));
  },
  updateReview: (id, updates) => set((state) => ({ reviews: state.reviews.map((review) => review.id === id ? { ...review, ...updates } : review) })),
  deleteReview: async (id) => { await api.delete(`/api/reviews/${id}`); set((state) => ({ reviews: state.reviews.filter((review) => review.id !== id) })); },
  likeReview: async (id) => { const result = await api.post<{ liked: boolean; like_count: number }>(`/api/reviews/${id}/like`); set((state) => ({ reviews: state.reviews.map((review) => review.id === id ? { ...review, isLiked: result.liked, likes: result.like_count } : review) })); },
  setFilter: (filter) => set((state) => ({ filter: { ...state.filter, ...filter } })), resetFilter: () => set({ filter: defaultFilter }),
  getWatchedMovies: () => get().movies.filter((movie) => movie.status === 'watched'), getWatchlistMovies: () => get().movies.filter((movie) => movie.isInWatchlist), getFavoriteMovies: () => get().movies.filter((movie) => movie.isFavorite),
  getMovieById: (id) => get().movies.find((movie) => movie.id === id), getReviewsForMovie: (movieId) => get().reviews.filter((review) => review.movieId === movieId),
  getFilteredMovies: () => {
    const { movies, filter } = get(); let result = [...movies]; const query = filter.search.toLowerCase();
    if (query) result = result.filter((movie) => movie.title.toLowerCase().includes(query) || movie.director.toLowerCase().includes(query));
    if (filter.genres.length) result = result.filter((movie) => movie.genre.some((genre) => filter.genres.includes(genre))); if (filter.status !== 'all') result = result.filter((movie) => movie.status === filter.status);
    result = result.filter((movie) => movie.year >= filter.yearRange[0] && movie.year <= filter.yearRange[1] && movie.imdbRating >= filter.ratingRange[0] && movie.imdbRating <= filter.ratingRange[1]);
    result.sort((a, b) => { let value = filter.sortBy === 'title' ? a.title.localeCompare(b.title) : filter.sortBy === 'year' ? a.year - b.year : filter.sortBy === 'rating' ? (a.userRating || 0) - (b.userRating || 0) : a.imdbRating - b.imdbRating; if (filter.sortBy === 'popularity') value = a.popularity - b.popularity; return filter.sortOrder === 'asc' ? value : -value; });
    return result;
  },
}));
