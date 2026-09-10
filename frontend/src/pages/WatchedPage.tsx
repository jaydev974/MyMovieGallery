import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useMovieStore } from '../store/movieStore';
import MovieCard from '../components/ui/MovieCard';
import { pageTransition, pageVariants } from '../animations/variants';

export default function WatchedPage() {
  const { getWatchedMovies, isLoading, error } = useMovieStore();
  const [query, setQuery] = useState('');
  const [genre, setGenre] = useState('all');
  const [sort, setSort] = useState<'recent' | 'title' | 'rating'>('recent');
  const watched = getWatchedMovies();
  const genres = useMemo(() => [...new Set(watched.flatMap((movie) => movie.genre))].sort(), [watched]);
  const visible = useMemo(() => watched.filter((movie) => (!query || movie.title.toLowerCase().includes(query.toLowerCase())) && (genre === 'all' || movie.genre.includes(genre))).sort((a, b) => sort === 'title' ? a.title.localeCompare(b.title) : sort === 'rating' ? b.imdbRating - a.imdbRating : (b.watchedDate || '').localeCompare(a.watchedDate || '')), [watched, query, genre, sort]);

  return <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={pageTransition} className="min-h-screen" style={{ background: 'var(--bg)' }}>
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8"><div><h1 className="text-3xl font-black" style={{ fontFamily: 'Poppins, sans-serif', color: 'var(--text)' }}>✓ Watched</h1><p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>{watched.length} movie{watched.length === 1 ? '' : 's'} in your history</p></div><Link to="/movies" className="px-4 py-2 rounded-xl text-sm font-bold no-underline" style={{ background: 'var(--accent)', color: '#000' }}>Browse movies</Link></div>
      <div className="glass-card p-3 mb-6 grid grid-cols-1 sm:grid-cols-3 gap-3"><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Filter watched movies" className="px-3 py-2 rounded-xl outline-none" style={{ background: 'var(--card-secondary)', border: '1px solid var(--border)', color: 'var(--text)' }} /><select value={genre} onChange={(event) => setGenre(event.target.value)} className="px-3 py-2 rounded-xl" style={{ background: 'var(--card-secondary)', border: '1px solid var(--border)', color: 'var(--text)' }}><option value="all">All genres</option>{genres.map((item) => <option key={item}>{item}</option>)}</select><select value={sort} onChange={(event) => setSort(event.target.value as typeof sort)} className="px-3 py-2 rounded-xl" style={{ background: 'var(--card-secondary)', border: '1px solid var(--border)', color: 'var(--text)' }}><option value="recent">Recently watched</option><option value="title">Title</option><option value="rating">Community rating</option></select></div>
      {isLoading ? <div className="glass-card p-10 text-center" style={{ color: 'var(--text-muted)' }}>Loading your watched history…</div> : error ? <div className="glass-card p-10 text-center" style={{ color: 'var(--danger)' }}>{error}</div> : visible.length ? <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">{visible.map((movie) => <MovieCard key={movie.id} movie={movie} />)}</div> : <div className="glass-card p-12 text-center"><div className="text-5xl mb-3">🎬</div><h2 className="font-bold text-lg" style={{ color: 'var(--text)' }}>{watched.length ? 'No matching watched movies' : 'Nothing watched yet'}</h2><p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>Mark movies as watched from their detail page and they will appear here.</p></div>}
    </div>
  </motion.div>;
}
