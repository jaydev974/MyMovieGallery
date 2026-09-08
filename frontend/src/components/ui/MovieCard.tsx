import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { HeartIcon, BookmarkIcon, StarIcon, EyeIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolid, BookmarkIcon as BookmarkSolid } from '@heroicons/react/24/solid';
import { useMovieStore } from '../../store/movieStore';
import { useToast } from './useToast';
import { formatRuntime, getRatingColor, GENRE_COLORS } from '../../utils/formatters';
import type { Movie } from '../../types';

interface MovieCardProps {
  movie: Movie;
  showActions?: boolean;
  compact?: boolean;
}

export default function MovieCard({ movie, showActions = true, compact = false }: MovieCardProps) {
  const { toggleFavorite, toggleWatchlist } = useMovieStore();
  const toast = useToast();
  const [hovered, setHovered] = useState(false);
  const [tiltStyle, setTiltStyle] = useState({});
  const cardRef = useRef<HTMLDivElement>(null);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const rotateX = ((y - cy) / cy) * -8;
    const rotateY = ((x - cx) / cx) * 8;
    setTiltStyle({
      transform: `perspective(600px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.04,1.04,1.04)`,
    });
  }

  function handleMouseLeave() {
    setHovered(false);
    setTiltStyle({ transform: 'perspective(600px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)' });
  }

  function handleFavorite(e: React.MouseEvent) {
    e.preventDefault();
    toggleFavorite(movie.id);
    toast.success(movie.isFavorite ? 'Removed from favorites' : 'Added to favorites!');
  }

  function handleWatchlist(e: React.MouseEvent) {
    e.preventDefault();
    toggleWatchlist(movie.id);
    toast.success(movie.isInWatchlist ? 'Removed from watchlist' : 'Added to watchlist!');
  }

  const ratingColor = getRatingColor(movie.imdbRating);

  return (
    <Link to={`/movies/${movie.id}`} className="block no-underline group">
      <motion.div
        ref={cardRef}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={handleMouseLeave}
        onMouseMove={handleMouseMove}
        style={{
          ...tiltStyle,
          transition: hovered ? 'none' : 'transform 0.4s ease',
          transformStyle: 'preserve-3d',
        }}
        className="relative rounded-2xl overflow-hidden cursor-pointer"
      >
        {/* Poster */}
        <div className="poster-ratio relative overflow-hidden"
          style={{ background: movie.posterColor }}>
          {/* Gradient overlay on hover */}
          <motion.div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.2) 50%, transparent 100%)' }}
            initial={{ opacity: 0.5 }}
            animate={{ opacity: hovered ? 0.85 : 0.5 }}
          />

          {/* Genre icon background pattern */}
          <div className="absolute inset-0 flex items-center justify-center text-8xl opacity-10 select-none">
            🎬
          </div>

          {/* IMDb rating badge */}
          <div className="absolute top-3 left-3 flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold"
            style={{
              background: 'rgba(0,0,0,0.7)',
              backdropFilter: 'blur(8px)',
              color: ratingColor,
              border: `1px solid ${ratingColor}44`,
            }}>
            ⭐ {movie.imdbRating}
          </div>

          {/* Status badge */}
          {movie.status && (
            <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-xs font-semibold"
              style={{
                background: movie.status === 'watched' ? 'rgba(34,197,94,0.2)' : 'rgba(59,130,246,0.2)',
                color: movie.status === 'watched' ? '#22c55e' : '#60a5fa',
                border: `1px solid ${movie.status === 'watched' ? '#22c55e44' : '#60a5fa44'}`,
              }}>
              {movie.status === 'watched' ? '✓' : movie.status === 'plan_to_watch' ? '🔖' : '▶'}
            </div>
          )}

          {/* Hover — Quick Actions */}
          {showActions && (
            <motion.div
              className="absolute bottom-0 left-0 right-0 p-3 flex gap-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: hovered ? 1 : 0, y: hovered ? 0 : 10 }}
              transition={{ duration: 0.2 }}
            >
              <button
                onClick={handleFavorite}
                className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl text-xs font-semibold transition-all"
                style={{
                  background: 'rgba(0,0,0,0.6)',
                  backdropFilter: 'blur(10px)',
                  color: movie.isFavorite ? '#ef4444' : '#fff',
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
              >
                {movie.isFavorite ? <HeartSolid className="w-3.5 h-3.5" /> : <HeartIcon className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={handleWatchlist}
                className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl text-xs font-semibold"
                style={{
                  background: 'rgba(0,0,0,0.6)',
                  backdropFilter: 'blur(10px)',
                  color: movie.isInWatchlist ? 'var(--accent)' : '#fff',
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
              >
                {movie.isInWatchlist ? <BookmarkSolid className="w-3.5 h-3.5" /> : <BookmarkIcon className="w-3.5 h-3.5" />}
              </button>
              <Link
                to={`/movies/${movie.id}`}
                className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl text-xs font-semibold no-underline"
                style={{
                  background: 'rgba(0,0,0,0.6)',
                  backdropFilter: 'blur(10px)',
                  color: '#fff',
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
              >
                <EyeIcon className="w-3.5 h-3.5" />
              </Link>
            </motion.div>
          )}
        </div>

        {/* Info */}
        <div className="p-3 space-y-1.5" style={{ background: 'var(--card)' }}>
          <h3 className="font-bold text-sm leading-tight line-clamp-1"
            style={{ fontFamily: 'Poppins, sans-serif', color: 'var(--text)' }}>
            {movie.title}
          </h3>

          <div className="flex items-center justify-between">
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {movie.year} · {formatRuntime(movie.runtime)}
            </span>
            {movie.userRating && (
              <div className="flex items-center gap-1 text-xs font-bold" style={{ color: 'var(--accent)' }}>
                <StarIcon className="w-3 h-3" />
                {movie.userRating}/10
              </div>
            )}
          </div>

          {!compact && (
            <div className="flex flex-wrap gap-1">
              {movie.genre.slice(0, 2).map((g) => (
                <span key={g} className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{
                    background: `${GENRE_COLORS[g] || '#888'}22`,
                    color: GENRE_COLORS[g] || '#888',
                    border: `1px solid ${GENRE_COLORS[g] || '#888'}33`,
                  }}>
                  {g}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Glow on hover */}
        <motion.div
          className="absolute inset-0 rounded-2xl pointer-events-none"
          animate={{ boxShadow: hovered ? `0 0 0 2px var(--accent), 0 20px 60px var(--glow)` : '0 0 0 1px var(--border)' }}
          transition={{ duration: 0.3 }}
        />
      </motion.div>
    </Link>
  );
}
