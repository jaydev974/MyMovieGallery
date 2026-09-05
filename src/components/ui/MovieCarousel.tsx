import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import MovieCard from './MovieCard';
import type { Movie } from '../../types';

interface MovieCarouselProps {
  title: string;
  movies: Movie[];
  subtitle?: string;
}

export default function MovieCarousel({ title, movies, subtitle }: MovieCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  function scroll(dir: 'left' | 'right') {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === 'left' ? -320 : 320, behavior: 'smooth' });
    setTimeout(() => {
      setCanScrollLeft(el.scrollLeft > 0);
      setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
    }, 300);
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <div>
          <h2 className="text-xl font-bold" style={{ fontFamily: 'Poppins, sans-serif', color: 'var(--text)' }}>
            {title}
          </h2>
          {subtitle && <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>{subtitle}</p>}
        </div>
        <div className="flex gap-2">
          <motion.button
            onClick={() => scroll('left')}
            disabled={!canScrollLeft}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="w-8 h-8 rounded-xl flex items-center justify-center transition-all"
            style={{
              background: 'var(--card)',
              border: '1px solid var(--border)',
              color: canScrollLeft ? 'var(--accent)' : 'var(--text-muted)',
              opacity: canScrollLeft ? 1 : 0.4,
            }}
          >
            <ChevronLeftIcon className="w-4 h-4" />
          </motion.button>
          <motion.button
            onClick={() => scroll('right')}
            disabled={!canScrollRight}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{
              background: 'var(--card)',
              border: '1px solid var(--border)',
              color: canScrollRight ? 'var(--accent)' : 'var(--text-muted)',
              opacity: canScrollRight ? 1 : 0.4,
            }}
          >
            <ChevronRightIcon className="w-4 h-4" />
          </motion.button>
        </div>
      </div>

      <div ref={scrollRef} className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
        {movies.map((movie, i) => (
          <motion.div
            key={movie.id}
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.05, duration: 0.4 }}
            className="flex-shrink-0 w-44"
          >
            <MovieCard movie={movie} compact />
          </motion.div>
        ))}
      </div>
    </section>
  );
}
