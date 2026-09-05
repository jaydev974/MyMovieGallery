import { motion } from 'framer-motion';
import { useMovieStore } from '../store/movieStore';
import { useToast } from '../components/ui/Toast';
import { pageVariants, pageTransition, staggerContainer, staggerItem } from '../animations/variants';
import { GENRE_COLORS } from '../utils/formatters';
import { Link } from 'react-router-dom';
import { TrashIcon, ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline';

export default function WatchlistPage() {
  const { movies, toggleWatchlist, updateMovie } = useMovieStore();
  const toast = useToast();
  const watchlist = movies.filter((m) => m.isInWatchlist).sort((a, b) => (a.watchlistPriority || 99) - (b.watchlistPriority || 99));

  function movePriority(id: number, dir: 'up' | 'down') {
    const idx = watchlist.findIndex((m) => m.id === id);
    if (dir === 'up' && idx === 0) return;
    if (dir === 'down' && idx === watchlist.length - 1) return;
    const targetIdx = dir === 'up' ? idx - 1 : idx + 1;
    const p1 = watchlist[idx].watchlistPriority || idx + 1;
    const p2 = watchlist[targetIdx].watchlistPriority || targetIdx + 1;
    updateMovie(watchlist[idx].id, { watchlistPriority: p2 });
    updateMovie(watchlist[targetIdx].id, { watchlistPriority: p1 });
  }

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={pageTransition}
      className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black" style={{ fontFamily: 'Poppins, sans-serif', color: 'var(--text)' }}>
              🔖 Watchlist
            </h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
              {watchlist.length} movie{watchlist.length !== 1 ? 's' : ''} to watch
            </p>
          </div>
        </div>

        {watchlist.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <div className="text-6xl mb-4">🔖</div>
            <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--text)' }}>Your watchlist is empty</h3>
            <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>Browse movies and add them to watch later</p>
            <Link to="/movies" className="px-6 py-3 rounded-xl font-semibold no-underline"
              style={{ background: 'var(--accent)', color: '#000' }}>
              Browse Movies
            </Link>
          </div>
        ) : (
          <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-4">
            {watchlist.map((movie, idx) => (
              <motion.div key={movie.id} variants={staggerItem}
                className="glass-card p-4 flex items-center gap-4 group hover:scale-[1.01] transition-transform">
                {/* Priority indicator */}
                <div className="flex flex-col items-center gap-1">
                  <button onClick={() => movePriority(movie.id, 'up')} disabled={idx === 0}
                    className="p-1 rounded transition-all disabled:opacity-20"
                    style={{ color: 'var(--text-muted)' }}>
                    <ChevronUpIcon className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-black w-5 h-5 rounded-full flex items-center justify-center"
                    style={{ background: idx === 0 ? 'var(--accent)' : 'var(--card-secondary)', color: idx === 0 ? '#000' : 'var(--text-muted)' }}>
                    {idx + 1}
                  </span>
                  <button onClick={() => movePriority(movie.id, 'down')} disabled={idx === watchlist.length - 1}
                    className="p-1 rounded transition-all disabled:opacity-20"
                    style={{ color: 'var(--text-muted)' }}>
                    <ChevronDownIcon className="w-4 h-4" />
                  </button>
                </div>

                {/* Poster */}
                <Link to={`/movies/${movie.id}`}
                  className="w-16 h-24 rounded-xl flex-shrink-0 flex items-center justify-center text-2xl no-underline hover:scale-105 transition-transform"
                  style={{ background: movie.posterColor }}>
                  🎬
                </Link>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <Link to={`/movies/${movie.id}`}
                    className="font-bold no-underline hover:underline"
                    style={{ color: 'var(--text)', fontFamily: 'Poppins, sans-serif' }}>
                    {movie.title}
                  </Link>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{movie.year} · {movie.director}</p>
                  <div className="flex gap-1 mt-1.5">
                    {movie.genre.slice(0, 2).map((g) => (
                      <span key={g} className="text-xs px-2 py-0.5 rounded-full"
                        style={{ background: GENRE_COLORS[g] + '22', color: GENRE_COLORS[g] }}>
                        {g}
                      </span>
                    ))}
                  </div>
                </div>

                {/* IMDb */}
                <div className="text-right flex-shrink-0">
                  <div className="font-bold text-sm" style={{ color: 'var(--accent)' }}>⭐ {movie.imdbRating}</div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{movie.runtime}min</div>
                </div>

                {/* Remove */}
                <button
                  onClick={() => { toggleWatchlist(movie.id); toast.success('Removed from watchlist'); }}
                  className="p-2 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                  style={{ color: 'var(--danger)' }}>
                  <TrashIcon className="w-5 h-5" />
                </button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
