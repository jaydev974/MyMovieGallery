import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeftIcon, HeartIcon, BookmarkIcon, ClockIcon, GlobeAltIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolid, BookmarkIcon as BookmarkSolid } from '@heroicons/react/24/solid';
import { useMovieStore } from '../store/movieStore';
import { useToast } from '../components/ui/Toast';
import RatingStars from '../components/ui/RatingStars';
import MovieCarousel from '../components/ui/MovieCarousel';
import { formatRuntime, formatMoney, getRatingColor, GENRE_COLORS } from '../utils/formatters';
import { pageVariants, pageTransition } from '../animations/variants';
import { useState } from 'react';

export default function MovieDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { movies, toggleFavorite, toggleWatchlist, rateMovie, markWatched } = useMovieStore();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<'overview' | 'cast' | 'reviews'>('overview');

  const movie = movies.find((m) => m.id === Number(id));
  const related = movies.filter((m) => m.id !== Number(id) && m.genre.some((g) => movie?.genre.includes(g))).slice(0, 8);

  if (!movie) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <div className="text-center">
          <div className="text-6xl mb-4">🎬</div>
          <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--text)' }}>Movie Not Found</h2>
          <Link to="/movies" className="px-4 py-2 rounded-xl no-underline font-semibold"
            style={{ background: 'var(--accent)', color: '#000' }}>Back to Gallery</Link>
        </div>
      </div>
    );
  }

  const ratingColor = getRatingColor(movie.imdbRating);

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={pageTransition}
      className="min-h-screen" style={{ background: 'var(--bg)' }}>

      {/* ─── Backdrop Hero ─────────────────────────────────────────── */}
      <div className="relative h-72 md:h-96 overflow-hidden">
        <div className="absolute inset-0" style={{ background: movie.backdropColor }} />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, var(--bg) 100%)' }} />

        {/* Back Button */}
        <Link to="/movies"
          className="absolute top-6 left-6 flex items-center gap-2 px-3 py-2 rounded-xl no-underline transition-all"
          style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}>
          <ArrowLeftIcon className="w-4 h-4" />
          <span className="text-sm font-medium">Back</span>
        </Link>

        {/* Film grain */}
        <div className="absolute inset-0 opacity-5"
          style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")' }} />
      </div>

      {/* ─── Main Content ──────────────────────────────────────────── */}
      <div className="px-4 md:px-8 max-w-6xl mx-auto -mt-32 relative z-10 pb-12">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Poster */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex-shrink-0 w-48 md:w-56"
          >
            <div className="poster-ratio rounded-2xl overflow-hidden shadow-2xl flex items-center justify-center text-6xl"
              style={{ background: movie.posterColor, boxShadow: `0 20px 60px ${movie.accentColor}44` }}>
              🎬
            </div>
          </motion.div>

          {/* Info */}
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
            className="flex-1 min-w-0 pt-32 md:pt-0">
            {/* Genres */}
            <div className="flex flex-wrap gap-2 mb-3">
              {movie.genre.map((g) => (
                <span key={g} className="text-xs px-3 py-1 rounded-full font-semibold"
                  style={{ background: GENRE_COLORS[g] + '22', color: GENRE_COLORS[g], border: `1px solid ${GENRE_COLORS[g]}44` }}>
                  {g}
                </span>
              ))}
            </div>

            <h1 className="text-3xl md:text-4xl font-black mb-2 leading-tight"
              style={{ fontFamily: 'Poppins, sans-serif', color: 'var(--text)' }}>
              {movie.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 mb-4">
              <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{movie.year}</span>
              <span className="flex items-center gap-1 text-sm" style={{ color: 'var(--text-muted)' }}>
                <ClockIcon className="w-4 h-4" />{formatRuntime(movie.runtime)}
              </span>
              <span className="flex items-center gap-1 text-sm" style={{ color: 'var(--text-muted)' }}>
                <GlobeAltIcon className="w-4 h-4" />{movie.language}
              </span>
              {/* IMDb */}
              <span className="flex items-center gap-1 font-bold px-2 py-1 rounded-lg text-sm"
                style={{ background: ratingColor + '22', color: ratingColor }}>
                ⭐ {movie.imdbRating} IMDb
              </span>
              {/* RT */}
              <span className="flex items-center gap-1 font-bold px-2 py-1 rounded-lg text-sm"
                style={{ background: 'rgba(248,94,68,0.15)', color: '#f85e44' }}>
                🍅 {movie.rottenTomatoes}%
              </span>
            </div>

            {/* Director */}
            <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
              Directed by <span className="font-semibold" style={{ color: 'var(--accent)' }}>{movie.director}</span>
            </p>

            {/* User Rating */}
            <div className="mb-6">
              <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>YOUR RATING</p>
              <RatingStars
                value={movie.userRating || 0}
                onChange={(r) => { rateMovie(movie.id, r); toast.success('Rating saved!'); }}
              />
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-3">
              <motion.button
                onClick={() => { toggleFavorite(movie.id); toast.success(movie.isFavorite ? 'Removed from favorites' : 'Added to favorites!'); }}
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm"
                style={{
                  background: movie.isFavorite ? 'rgba(239,68,68,0.2)' : 'var(--card)',
                  border: `1px solid ${movie.isFavorite ? '#ef4444' : 'var(--border)'}`,
                  color: movie.isFavorite ? '#ef4444' : 'var(--text)',
                }}>
                {movie.isFavorite ? <HeartSolid className="w-4 h-4" /> : <HeartIcon className="w-4 h-4" />}
                {movie.isFavorite ? 'Favorited' : 'Favorite'}
              </motion.button>

              <motion.button
                onClick={() => { toggleWatchlist(movie.id); toast.success(movie.isInWatchlist ? 'Removed from watchlist' : 'Added to watchlist!'); }}
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm"
                style={{
                  background: movie.isInWatchlist ? 'var(--accent)' + '22' : 'var(--card)',
                  border: `1px solid ${movie.isInWatchlist ? 'var(--accent)' : 'var(--border)'}`,
                  color: movie.isInWatchlist ? 'var(--accent)' : 'var(--text)',
                }}>
                {movie.isInWatchlist ? <BookmarkSolid className="w-4 h-4" /> : <BookmarkIcon className="w-4 h-4" />}
                Watchlist
              </motion.button>

              {movie.status !== 'watched' && (
                <motion.button
                  onClick={() => { markWatched(movie.id); toast.success('Marked as watched! 🎬'); }}
                  whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm"
                  style={{ background: 'var(--success)', color: '#fff' }}>
                  ✓ Mark Watched
                </motion.button>
              )}
            </div>

            {/* Streaming */}
            {movie.streamingOn && movie.streamingOn.length > 0 && (
              <div className="mt-4">
                <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>STREAMING ON</p>
                <div className="flex flex-wrap gap-2">
                  {movie.streamingOn.map((s) => (
                    <span key={s} className="text-xs px-2 py-1 rounded-lg font-medium"
                      style={{ background: 'var(--card-secondary)', border: '1px solid var(--border)', color: 'var(--text)' }}>
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </div>

        {/* ─── Tabs ──────────────────────────────────────────────────── */}
        <div className="mt-10">
          <div className="flex gap-4 mb-6" style={{ borderBottom: '1px solid var(--border)' }}>
            {(['overview', 'cast', 'reviews'] as const).map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className="pb-3 text-sm font-semibold capitalize relative transition-colors"
                style={{ color: activeTab === tab ? 'var(--accent)' : 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>
                {tab}
                {activeTab === tab && (
                  <motion.div layoutId="tab-indicator" className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                    style={{ background: 'var(--accent)' }} />
                )}
              </button>
            ))}
          </div>

          {activeTab === 'overview' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <p className="text-base leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{movie.overview}</p>
              {(movie.budget || movie.boxOffice) && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {movie.budget && (
                    <div className="glass-card p-4">
                      <p className="text-xs font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>BUDGET</p>
                      <p className="font-bold" style={{ color: 'var(--accent)' }}>{formatMoney(movie.budget)}</p>
                    </div>
                  )}
                  {movie.boxOffice && (
                    <div className="glass-card p-4">
                      <p className="text-xs font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>BOX OFFICE</p>
                      <p className="font-bold" style={{ color: 'var(--success)' }}>{formatMoney(movie.boxOffice)}</p>
                    </div>
                  )}
                </div>
              )}
              {movie.awards && (
                <div>
                  <p className="font-bold mb-3" style={{ color: 'var(--text)' }}>🏆 Awards</p>
                  <div className="space-y-2">
                    {movie.awards.map((a) => (
                      <div key={a} className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                        <span>🥇</span>{a}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'cast' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {movie.cast.map((member) => (
                <div key={member.id} className="glass-card p-4 text-center hover:scale-105 transition-transform">
                  <div className="w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center text-2xl font-bold"
                    style={{ background: 'var(--card-secondary)', color: 'var(--accent)' }}>
                    {member.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                  </div>
                  <p className="font-bold text-sm" style={{ color: 'var(--text)' }}>{member.name}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{member.character}</p>
                </div>
              ))}
            </motion.div>
          )}

          {activeTab === 'reviews' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <div className="glass-card p-6 text-center">
                <div className="text-4xl mb-3">✍️</div>
                <p className="font-semibold mb-2" style={{ color: 'var(--text)' }}>Be the first to review</p>
                <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>Share your thoughts on {movie.title}</p>
                <Link to="/reviews" className="px-4 py-2 rounded-xl text-sm font-semibold no-underline"
                  style={{ background: 'var(--accent)', color: '#000' }}>
                  Write a Review
                </Link>
              </div>
            </motion.div>
          )}
        </div>

        {/* ─── Related Movies ─────────────────────────────────────── */}
        {related.length > 0 && (
          <div className="mt-12">
            <MovieCarousel title="🎬 You Might Also Like" movies={related} />
          </div>
        )}
      </div>
    </motion.div>
  );
}
