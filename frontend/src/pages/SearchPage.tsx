import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { useMovieStore } from '../store/movieStore';
import MovieCard from '../components/ui/MovieCard';
import { useDebounce } from '../hooks';
import { pageVariants, pageTransition, staggerContainer, staggerItem } from '../animations/variants';
import { ALL_GENRES } from '../utils/mockData';
import { GENRE_COLORS } from '../utils/formatters';
import { api } from '../api/client';

interface OmdbResult { imdb_id: string; title: string; year: string; poster: string }

export default function SearchPage() {
  const [params] = useSearchParams();
  const [query, setQuery] = useState(params.get('q') || '');
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const { movies } = useMovieStore();
  const dq = useDebounce(query, 300);
  const [omdbResults, setOmdbResults] = useState<OmdbResult[]>([]);

  useEffect(() => {
    if (dq.length < 2) { setOmdbResults([]); return; }
    api.get<{ results: OmdbResult[] }>(`/api/metadata/omdb/search?query=${encodeURIComponent(dq)}`)
      .then((response) => setOmdbResults(response.results))
      .catch(() => setOmdbResults([])); // Catalog search remains useful if OMDb is not configured.
  }, [dq]);

  const results = useMemo(() => {
    if (!dq && selectedGenres.length === 0) return [];
    return movies.filter((m) => {
      const matchesQ = !dq || m.title.toLowerCase().includes(dq.toLowerCase()) ||
        m.director.toLowerCase().includes(dq.toLowerCase()) ||
        m.cast.some((c) => c.name.toLowerCase().includes(dq.toLowerCase()));
      const matchesGenre = selectedGenres.length === 0 || m.genre.some((g) => selectedGenres.includes(g));
      return matchesQ && matchesGenre;
    });
  }, [movies, dq, selectedGenres]);

  const genreToggle = (g: string) => {
    setSelectedGenres((p) => p.includes(g) ? p.filter((x) => x !== g) : [...p, g]);
  };

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={pageTransition}
      className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <div className="max-w-6xl mx-auto px-4 py-10">
        {/* Hero Search */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black mb-4" style={{ fontFamily: 'Poppins, sans-serif', color: 'var(--text)' }}>
            🔍 Search Movies
          </h1>
          <p className="text-sm mb-8" style={{ color: 'var(--text-muted)' }}>Search by title, director, or cast</p>

          <div className="relative max-w-2xl mx-auto">
            <MagnifyingGlassIcon className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6" style={{ color: 'var(--text-muted)' }} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search movies, directors, actors…"
              className="w-full pl-14 pr-6 py-5 rounded-2xl text-lg outline-none"
              style={{
                background: 'var(--card)',
                border: '2px solid var(--border)',
                color: 'var(--text)',
                boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
              }}
              onFocus={(e) => { e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 0 4px var(--glow), 0 10px 40px rgba(0,0,0,0.2)'; }}
              onBlur={(e) => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = '0 10px 40px rgba(0,0,0,0.2)'; }}
              autoFocus
            />
          </div>
        </div>

        {/* Genre Filters */}
        <div className="flex flex-wrap gap-2 justify-center mb-8">
          {ALL_GENRES.map((g) => (
            <button key={g} onClick={() => genreToggle(g)}
              className="px-4 py-1.5 rounded-full text-sm font-medium transition-all hover:scale-105"
              style={{
                background: selectedGenres.includes(g) ? GENRE_COLORS[g] || 'var(--accent)' : 'var(--card)',
                color: selectedGenres.includes(g) ? '#fff' : 'var(--text-muted)',
                border: `1px solid ${selectedGenres.includes(g) ? GENRE_COLORS[g] || 'var(--accent)' : 'var(--border)'}`,
              }}>
              {g}
            </button>
          ))}
        </div>

        {/* Results */}
        {(dq || selectedGenres.length > 0) ? (
          results.length > 0 ? (
            <>
              <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
                Found <span className="font-bold" style={{ color: 'var(--accent)' }}>{results.length}</span> results
                {dq && <> for "<span className="font-bold" style={{ color: 'var(--text)' }}>{dq}</span>"</>}
              </p>
              <motion.div variants={staggerContainer} initial="initial" animate="animate"
                className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {results.map((movie) => (
                  <motion.div key={movie.id} variants={staggerItem}>
                    <MovieCard movie={movie} />
                  </motion.div>
                ))}
              </motion.div>
              {omdbResults.length > 0 && (
                <div className="mt-10"><h2 className="font-bold mb-3" style={{ color: 'var(--text)' }}>More results from OMDb</h2><div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">{omdbResults.map((movie) => <a key={movie.imdb_id} href={`https://www.imdb.com/title/${movie.imdb_id}/`} target="_blank" rel="noreferrer" className="glass-card p-3 no-underline"><p className="font-bold text-sm" style={{ color: 'var(--text)' }}>{movie.title}</p><p className="text-xs" style={{ color: 'var(--text-muted)' }}>{movie.year}</p></a>)}</div></div>
              )}
            </>
          ) : omdbResults.length > 0 ? (
            <div>
              <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>No matching movies in your gallery. Results from OMDb:</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">{omdbResults.map((movie) => <a key={movie.imdb_id} href={`https://www.imdb.com/title/${movie.imdb_id}/`} target="_blank" rel="noreferrer" className="glass-card p-3 no-underline"><p className="font-bold text-sm" style={{ color: 'var(--text)' }}>{movie.title}</p><p className="text-xs" style={{ color: 'var(--text-muted)' }}>{movie.year}</p></a>)}</div>
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">🎭</div>
              <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--text)' }}>No results found</h3>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Try a different search term or genre filter</p>
            </div>
          )
        ) : (
          /* Empty state — suggestions */
          <div className="text-center py-12">
            <p className="text-lg font-semibold mb-6" style={{ color: 'var(--text-muted)' }}>🎬 Try searching for…</p>
            <div className="flex flex-wrap gap-3 justify-center">
              {['Christopher Nolan', 'Inception', 'Sci-Fi', 'Denis Villeneuve', 'Leonardo DiCaprio'].map((s) => (
                <button key={s} onClick={() => setQuery(s)}
                  className="px-4 py-2 rounded-xl text-sm font-medium transition-all hover:scale-105"
                  style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--text)' }}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
