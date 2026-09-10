import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useMovieStore } from '../store/movieStore';
import MovieCard from '../components/ui/MovieCard';
import GradientOrbs from '../components/effects/GradientOrbs';
import { pageVariants, pageTransition, staggerContainer, staggerItem, fadeInUp } from '../animations/variants';
import type { Movie } from '../types';
import { api } from '../api/client';
import { useToastStore } from '../store/toastStore';

interface RecommendedMovie {
  movie: Movie;
  confidence: number;
  similarity: number;
  reasons: Array<{ type: string; label: string }>;
  genreOverlap: string[];
}

interface ApiMovie {
  id: string;
  title: string;
  slug: string;
  year: number | null;
  overview: string | null;
  genres: string[];
  status: string;
  vote_average: number | null;
  runtime_minutes: number | null;
}

interface ApiRecommendations {
  cold_start: boolean;
  results: Array<{
    movie: ApiMovie;
    score: number;
    confidence: number;
    reasons: string[];
    genre_overlap: string[];
  }>;
}

function mapRecommendationMovie(apiMovie: ApiMovie, localMovie: Movie | undefined, index: number): Movie {
  if (localMovie) return localMovie;
  const year = apiMovie.year || 0;
  return {
    id: -(index + 1), backendId: apiMovie.id, title: apiMovie.title, year, genre: apiMovie.genres,
    overview: apiMovie.overview || '', director: 'Unknown', cast: [], runtime: apiMovie.runtime_minutes || 0,
    language: 'English', country: 'USA', imdbRating: apiMovie.vote_average || 0, rottenTomatoes: 0,
    posterColor: 'linear-gradient(145deg, #172033, #334155)', accentColor: '#fbbf24', backdropColor: 'linear-gradient(135deg, #172033, #0f172a)',
    status: undefined, decade: Math.floor(year / 10) * 10, popularity: apiMovie.vote_average || 0,
  };
}

export default function RecommendationsPage() {
  const { movies, getWatchedMovies } = useMovieStore();
  const addToast = useToastStore((state) => state.addToast);
  const watched = getWatchedMovies();
  const watchedKey = watched.map((movie) => movie.id).join(',');
  const [recommendations, setRecommendations] = useState<RecommendedMovie[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [coldStart, setColdStart] = useState(false);

  const loadRecommendations = useCallback(async () => {
      setIsLoading(true);
      setError(null);
      try {
        const payload = await api.get<ApiRecommendations>('/api/recommendations/me?limit=20');
        setColdStart(payload.cold_start);
        setRecommendations(payload.results.map((result, index) => ({
          movie: mapRecommendationMovie(result.movie, movies.find((movie) => movie.backendId === result.movie.id), index),
          confidence: result.confidence,
          similarity: Math.round(result.score * 100),
          reasons: result.reasons.map((label) => ({ type: 'model' as const, label })),
          genreOverlap: result.genre_overlap,
        })));
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to load recommendations';
        setError(message);
        addToast({ type: 'error', title: 'Recommendations unavailable', message });
      } finally {
        setIsLoading(false);
      }
  }, [addToast, movies]);

  useEffect(() => {
    void loadRecommendations();
    window.addEventListener('mmg:recommendations-refresh', loadRecommendations);
    return () => window.removeEventListener('mmg:recommendations-refresh', loadRecommendations);
  }, [loadRecommendations, watchedKey]);

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={pageTransition}
      className="min-h-screen relative" style={{ background: 'var(--bg)' }}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <GradientOrbs />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-10">
        {/* Hero */}
        <motion.div variants={fadeInUp} initial="initial" animate="animate" className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold mb-4"
            style={{ background: 'var(--accent)' + '22', border: '1px solid var(--border)', color: 'var(--accent)' }}>
            ✨ AI-Powered
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-4" style={{ fontFamily: 'Poppins, sans-serif', color: 'var(--text)' }}>
            Recommended <span className="gradient-text">For You</span>
          </h1>
          <p className="text-lg max-w-xl mx-auto" style={{ color: 'var(--text-muted)' }}>
            {coldStart ? 'Popular and featured picks to help us learn your taste' : `Based on your ${watched.length} watched films, ratings, favorites, and recency`}
          </p>
        </motion.div>

        {isLoading ? (
          <div className="text-center py-20" style={{ color: 'var(--text-muted)' }}>Loading recommendations...</div>
        ) : error ? (
          <div className="glass-card text-center py-12 px-6" style={{ color: 'var(--danger)' }}>
            <h3 className="text-xl font-bold mb-2">We could not load your recommendations</h3>
            <p className="text-sm mb-5" style={{ color: 'var(--text-muted)' }}>{error}</p>
            <button className="px-4 py-2 rounded-xl font-bold" style={{ background: 'var(--accent)', color: '#000' }} onClick={() => void loadRecommendations()}>Try again</button>
          </div>
        ) : recommendations.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🎬</div>
            <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--text)' }}>No recommendations yet</h3>
            <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>Add movies to your watchlist, mark one watched, or rate a film to get started.</p>
          </div>
        ) : (
          <motion.div variants={staggerContainer} initial="initial" animate="animate"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {recommendations.map(({ movie, confidence, reasons, genreOverlap }) => (
              <motion.div key={movie.id} variants={staggerItem}>
                {/* Recommendation Card */}
                <div className="flex flex-col gap-3">
                  <MovieCard movie={movie} />
                  {/* Reason tags */}
                  <div className="glass-card p-3 space-y-2">
                    {/* Confidence bar */}
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span style={{ color: 'var(--text-muted)' }}>Match</span>
                      <span className="font-bold" style={{ color: 'var(--accent)' }}>{confidence}%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--card-secondary)' }}>
                      <motion.div
                        className="h-full rounded-full"
                        style={{ background: 'var(--accent)' }}
                        initial={{ width: 0 }}
                        whileInView={{ width: `${confidence}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                      />
                    </div>
                    {/* Reasons */}
                    <div className="flex flex-col gap-1">
                      {reasons.slice(0, 2).map((r, i) => (
                        <p key={i} className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          <span style={{ color: 'var(--accent)' }}>✦</span> {r.label}
                        </p>
                      ))}
                    </div>
                    {/* Genre overlap */}
                    {genreOverlap.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {genreOverlap.slice(0, 3).map((g) => (
                          <span key={g} className="text-xs px-2 py-0.5 rounded-full"
                            style={{ background: 'var(--card-secondary)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
                            {g}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
