import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { MagnifyingGlassIcon, AdjustmentsHorizontalIcon, Squares2X2Icon, ListBulletIcon } from '@heroicons/react/24/outline';
import { useMovieStore } from '../store/movieStore';
import MovieCard from '../components/ui/MovieCard';

import { ALL_GENRES } from '../utils/mockData';
import { GENRE_COLORS } from '../utils/formatters';
import { pageVariants, pageTransition, staggerContainer, staggerItem } from '../animations/variants';

type ViewMode = 'grid' | 'list';


export default function MovieGalleryPage() {
  const { movies, filter, setFilter } = useMovieStore();
  const [view, setView] = useState<ViewMode>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [localSearch, setLocalSearch] = useState('');

  const filteredMovies = useMemo(() => {
    let result = [...movies];
    const q = localSearch.toLowerCase();
    if (q) result = result.filter((m) => m.title.toLowerCase().includes(q) || m.director.toLowerCase().includes(q));
    if (filter.genres.length) result = result.filter((m) => m.genre.some((g) => filter.genres.includes(g)));
    if (filter.status !== 'all') result = result.filter((m) => m.status === filter.status);
    return result.sort((a, b) => {
      if (filter.sortBy === 'title') return a.title.localeCompare(b.title);
      if (filter.sortBy === 'year') return b.year - a.year;
      if (filter.sortBy === 'imdb') return b.imdbRating - a.imdbRating;
      if (filter.sortBy === 'rating') return (b.userRating || 0) - (a.userRating || 0);
      return b.popularity - a.popularity;
    });
  }, [movies, localSearch, filter]);

  const genreToggle = (g: string) => {
    setFilter({ genres: filter.genres.includes(g) ? filter.genres.filter((x) => x !== g) : [...filter.genres, g] });
  };

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={pageTransition}
      className="min-h-screen" style={{ background: 'var(--bg)' }}>

      {/* Header */}
      <div className="px-6 pt-6 pb-4" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black" style={{ fontFamily: 'Poppins, sans-serif', color: 'var(--text)' }}>
                🎬 Movie Gallery
              </h1>
              <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                {filteredMovies.length} of {movies.length} movies
              </p>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              {/* Search */}
              <div className="relative flex-1 sm:w-64">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                <input
                  value={localSearch}
                  onChange={(e) => setLocalSearch(e.target.value)}
                  placeholder="Search movies, directors…"
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none"
                  style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--text)' }}
                  onFocus={(e) => (e.target.style.borderColor = 'var(--accent)')}
                  onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
                />
              </div>
              {/* Filter toggle */}
              <motion.button
                onClick={() => setShowFilters((p) => !p)}
                whileHover={{ scale: 1.05 }}
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium"
                style={{
                  background: showFilters ? 'var(--accent)' : 'var(--card)',
                  border: '1px solid var(--border)',
                  color: showFilters ? '#000' : 'var(--text)',
                }}>
                <AdjustmentsHorizontalIcon className="w-4 h-4" />
                Filters
                {filter.genres.length > 0 && (
                  <span className="w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center"
                    style={{ background: '#000', color: 'var(--accent)' }}>{filter.genres.length}</span>
                )}
              </motion.button>
              {/* View toggle */}
              <div className="flex rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
                {(['grid', 'list'] as ViewMode[]).map((v) => (
                  <button key={v} onClick={() => setView(v)}
                    className="p-2.5 transition-all"
                    style={{ background: view === v ? 'var(--accent)' : 'var(--card)', color: view === v ? '#000' : 'var(--text-muted)' }}>
                    {v === 'grid' ? <Squares2X2Icon className="w-4 h-4" /> : <ListBulletIcon className="w-4 h-4" />}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }} className="mt-4 overflow-hidden">
              <div className="space-y-4 py-4">
                {/* Genre chips */}
                <div>
                  <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>GENRES</p>
                  <div className="flex flex-wrap gap-2">
                    {ALL_GENRES.map((g) => (
                      <button key={g} onClick={() => genreToggle(g)}
                        className="px-3 py-1 rounded-full text-xs font-semibold transition-all"
                        style={{
                          background: filter.genres.includes(g) ? GENRE_COLORS[g] || 'var(--accent)' : 'var(--card-secondary)',
                          color: filter.genres.includes(g) ? '#fff' : 'var(--text-muted)',
                          border: `1px solid ${filter.genres.includes(g) ? GENRE_COLORS[g] || 'var(--accent)' : 'var(--border)'}`,
                        }}>
                        {g}
                      </button>
                    ))}
                  </div>
                </div>
                {/* Status + Sort */}
                <div className="flex flex-wrap gap-4">
                  <div>
                    <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>STATUS</p>
                    <div className="flex gap-2">
                      {['all', 'watched', 'plan_to_watch', 'watching'].map((s) => (
                        <button key={s} onClick={() => setFilter({ status: s as any })}
                          className="px-3 py-1 rounded-xl text-xs font-semibold"
                          style={{
                            background: filter.status === s ? 'var(--accent)' : 'var(--card-secondary)',
                            color: filter.status === s ? '#000' : 'var(--text-muted)',
                          }}>
                          {s === 'all' ? 'All' : s === 'plan_to_watch' ? 'Watchlist' : s.charAt(0).toUpperCase() + s.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>SORT BY</p>
                    <div className="flex gap-2">
                      {[{ val: 'popularity', label: 'Trending' }, { val: 'imdb', label: 'IMDb' }, { val: 'year', label: 'Year' }, { val: 'title', label: 'A-Z' }].map((s) => (
                        <button key={s.val} onClick={() => setFilter({ sortBy: s.val as any })}
                          className="px-3 py-1 rounded-xl text-xs font-semibold"
                          style={{
                            background: filter.sortBy === s.val ? 'var(--accent)' : 'var(--card-secondary)',
                            color: filter.sortBy === s.val ? '#000' : 'var(--text-muted)',
                          }}>
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  {filter.genres.length > 0 && (
                    <button onClick={() => setFilter({ genres: [] })}
                      className="self-end px-3 py-1 rounded-xl text-xs font-semibold"
                      style={{ background: 'var(--danger)' + '22', color: 'var(--danger)', border: '1px solid var(--danger)' + '44' }}>
                      Clear Filters
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Movie Grid */}
      <div className="px-6 py-6 max-w-7xl mx-auto">
        {filteredMovies.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="text-6xl">🎭</div>
            <h3 className="text-xl font-bold" style={{ color: 'var(--text)' }}>No movies found</h3>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Try adjusting your filters or search</p>
            <button onClick={() => { setLocalSearch(''); setFilter({ genres: [], status: 'all' }); }}
              className="px-4 py-2 rounded-xl text-sm font-semibold"
              style={{ background: 'var(--accent)', color: '#000' }}>
              Clear all filters
            </button>
          </div>
        ) : (
          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className={view === 'grid'
              ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4'
              : 'space-y-3'}
          >
            {filteredMovies.map((movie) => (
              <motion.div key={movie.id} variants={staggerItem}>
                {view === 'grid' ? (
                  <MovieCard movie={movie} />
                ) : (
                  /* List View */
                  <div className="glass-card p-4 flex items-center gap-4 hover:scale-[1.01] transition-transform">
                    <div className="w-12 h-16 rounded-xl flex-shrink-0 flex items-center justify-center text-2xl"
                      style={{ background: movie.posterColor }}>🎬</div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold truncate" style={{ color: 'var(--text)' }}>{movie.title}</h3>
                      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{movie.year} · {movie.director}</p>
                      <div className="flex gap-1 mt-1">
                        {movie.genre.slice(0, 3).map((g) => (
                          <span key={g} className="text-xs px-2 py-0.5 rounded-full"
                            style={{ background: GENRE_COLORS[g] + '22', color: GENRE_COLORS[g] }}>
                            {g}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="font-bold" style={{ color: 'var(--accent)' }}>⭐ {movie.imdbRating}</div>
                      {movie.userRating && <div className="text-sm" style={{ color: 'var(--text-muted)' }}>My: {movie.userRating}/10</div>}
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
