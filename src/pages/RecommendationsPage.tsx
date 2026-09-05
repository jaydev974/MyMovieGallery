import { motion } from 'framer-motion';
import { useMovieStore } from '../store/movieStore';
import MovieCard from '../components/ui/MovieCard';
import GradientOrbs from '../components/effects/GradientOrbs';
import { pageVariants, pageTransition, staggerContainer, staggerItem, fadeInUp } from '../animations/variants';
import type { Movie } from '../types';

interface RecommendationReason {
  label: string;
  type: string;
}

interface RecommendedMovie {
  movie: Movie;
  confidence: number;
  similarity: number;
  reasons: RecommendationReason[];
  genreOverlap: string[];
}

function getRecommendations(movies: Movie[], watched: Movie[]): RecommendedMovie[] {
  const watchedGenres = watched.flatMap((m) => m.genre);
  const genreCounts: Record<string, number> = {};
  watchedGenres.forEach((g) => { genreCounts[g] = (genreCounts[g] || 0) + 1; });
  const watchedIds = new Set(watched.map((m) => m.id));
  const watchedDirectors = watched.map((m) => m.director);

  return movies
    .filter((m) => !watchedIds.has(m.id))
    .map((movie) => {
      const genreOverlap = movie.genre.filter((g) => genreCounts[g]);
      const genreScore = genreOverlap.reduce((acc, g) => acc + (genreCounts[g] || 0), 0);
      const directorMatch = watchedDirectors.includes(movie.director);
      const similarity = Math.min(100, Math.round((genreScore * 15) + (directorMatch ? 25 : 0) + (movie.imdbRating * 3)));
      const confidence = Math.min(100, Math.round(similarity * 0.85 + movie.popularity * 0.15));

      const reasons: RecommendationReason[] = [];
      if (directorMatch) {
        const matchedFilm = watched.find((m) => m.director === movie.director);
        reasons.push({ type: 'same_director', label: `Because you liked ${matchedFilm?.title}` });
      }
      genreOverlap.slice(0, 2).forEach((g) => {
        const relatedFilm = watched.find((m) => m.genre.includes(g));
        if (relatedFilm) reasons.push({ type: 'similar_movie', label: `Similar to ${relatedFilm.title}` });
      });
      if (movie.popularity > 90) reasons.push({ type: 'trending', label: 'Trending this week' });

      return { movie, confidence, similarity, reasons, genreOverlap };
    })
    .filter((r) => r.similarity > 0)
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 20);
}

export default function RecommendationsPage() {
  const { movies, getWatchedMovies } = useMovieStore();
  const watched = getWatchedMovies();
  const recommendations = getRecommendations(movies, watched);

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
            Based on your {watched.length} watched films, your taste preferences, and trending cinema
          </p>
        </motion.div>

        {recommendations.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🎬</div>
            <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--text)' }}>Rate more movies to unlock recommendations</h3>
            <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>The more you watch and rate, the better we know your taste</p>
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
