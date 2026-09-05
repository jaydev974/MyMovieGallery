import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Movie, Review, FilterState } from '../types';
import { MOCK_MOVIES } from '../utils/mockData';

interface MovieState {
  movies: Movie[];
  reviews: Review[];
  filter: FilterState;
  
  // Actions
  addMovie: (movie: Movie) => void;
  updateMovie: (id: number, updates: Partial<Movie>) => void;
  removeMovie: (id: number) => void;
  toggleFavorite: (id: number) => void;
  toggleWatchlist: (id: number) => void;
  rateMovie: (id: number, rating: number) => void;
  markWatched: (id: number, date?: string) => void;
  
  // Reviews
  addReview: (review: Review) => void;
  updateReview: (id: string, updates: Partial<Review>) => void;
  deleteReview: (id: string) => void;
  likeReview: (id: string) => void;
  
  // Filter
  setFilter: (filter: Partial<FilterState>) => void;
  resetFilter: () => void;
  
  // Computed
  getWatchedMovies: () => Movie[];
  getWatchlistMovies: () => Movie[];
  getFavoriteMovies: () => Movie[];
  getFilteredMovies: () => Movie[];
  getMovieById: (id: number) => Movie | undefined;
  getReviewsForMovie: (movieId: number) => Review[];
}

const defaultFilter: FilterState = {
  genres: [],
  yearRange: [1920, 2026],
  ratingRange: [0, 10],
  languages: [],
  status: 'all',
  sortBy: 'popularity',
  sortOrder: 'desc',
  search: '',
};

export const useMovieStore = create<MovieState>()(
  persist(
    (set, get) => ({
      movies: MOCK_MOVIES,
      reviews: [],
      filter: defaultFilter,

      addMovie: (movie) => set((s) => ({ movies: [...s.movies, movie] })),

      updateMovie: (id, updates) =>
        set((s) => ({
          movies: s.movies.map((m) => (m.id === id ? { ...m, ...updates } : m)),
        })),

      removeMovie: (id) =>
        set((s) => ({ movies: s.movies.filter((m) => m.id !== id) })),

      toggleFavorite: (id) =>
        set((s) => ({
          movies: s.movies.map((m) =>
            m.id === id ? { ...m, isFavorite: !m.isFavorite } : m
          ),
        })),

      toggleWatchlist: (id) =>
        set((s) => ({
          movies: s.movies.map((m) =>
            m.id === id ? { ...m, isInWatchlist: !m.isInWatchlist } : m
          ),
        })),

      rateMovie: (id, rating) =>
        set((s) => ({
          movies: s.movies.map((m) => (m.id === id ? { ...m, userRating: rating } : m)),
        })),

      markWatched: (id, date) =>
        set((s) => ({
          movies: s.movies.map((m) =>
            m.id === id
              ? { ...m, status: 'watched', watchedDate: date || new Date().toISOString().split('T')[0] }
              : m
          ),
        })),

      addReview: (review) => set((s) => ({ reviews: [review, ...s.reviews] })),

      updateReview: (id, updates) =>
        set((s) => ({
          reviews: s.reviews.map((r) => (r.id === id ? { ...r, ...updates } : r)),
        })),

      deleteReview: (id) =>
        set((s) => ({ reviews: s.reviews.filter((r) => r.id !== id) })),

      likeReview: (id) =>
        set((s) => ({
          reviews: s.reviews.map((r) =>
            r.id === id
              ? { ...r, likes: r.isLiked ? r.likes - 1 : r.likes + 1, isLiked: !r.isLiked }
              : r
          ),
        })),

      setFilter: (filter) =>
        set((s) => ({ filter: { ...s.filter, ...filter } })),

      resetFilter: () => set({ filter: defaultFilter }),

      getWatchedMovies: () => get().movies.filter((m) => m.status === 'watched'),
      getWatchlistMovies: () => get().movies.filter((m) => m.isInWatchlist),
      getFavoriteMovies: () => get().movies.filter((m) => m.isFavorite),
      getMovieById: (id) => get().movies.find((m) => m.id === id),
      getReviewsForMovie: (movieId) => get().reviews.filter((r) => r.movieId === movieId),

      getFilteredMovies: () => {
        const { movies, filter } = get();
        let result = [...movies];
        if (filter.search) {
          const q = filter.search.toLowerCase();
          result = result.filter(
            (m) => m.title.toLowerCase().includes(q) || m.director.toLowerCase().includes(q)
          );
        }
        if (filter.genres.length) {
          result = result.filter((m) => m.genre.some((g) => filter.genres.includes(g)));
        }
        if (filter.status !== 'all') {
          result = result.filter((m) => m.status === filter.status);
        }
        result = result.filter(
          (m) => m.year >= filter.yearRange[0] && m.year <= filter.yearRange[1]
        );
        result = result.filter(
          (m) => m.imdbRating >= filter.ratingRange[0] && m.imdbRating <= filter.ratingRange[1]
        );
        result.sort((a, b) => {
          let val = 0;
          if (filter.sortBy === 'title') val = a.title.localeCompare(b.title);
          else if (filter.sortBy === 'year') val = a.year - b.year;
          else if (filter.sortBy === 'rating') val = (a.userRating || 0) - (b.userRating || 0);
          else if (filter.sortBy === 'imdb') val = a.imdbRating - b.imdbRating;
          else if (filter.sortBy === 'popularity') val = a.popularity - b.popularity;
          return filter.sortOrder === 'asc' ? val : -val;
        });
        return result;
      },
    }),
    { name: 'mmg-movies' }
  )
);
