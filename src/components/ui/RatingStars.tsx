import { motion } from 'framer-motion';
import { StarIcon } from '@heroicons/react/24/solid';
import { StarIcon as StarOutline } from '@heroicons/react/24/outline';
import { useState } from 'react';

interface RatingStarsProps {
  value: number;
  max?: number;
  onChange?: (rating: number) => void;
  size?: 'sm' | 'md' | 'lg';
  readonly?: boolean;
}

export default function RatingStars({ value, max = 10, onChange, size = 'md', readonly = false }: RatingStarsProps) {
  const [hoverVal, setHoverVal] = useState(0);
  const stars = max === 10 ? 5 : max;
  const scale = max / stars;
  const display = hoverVal || value;

  const sizes = { sm: 'w-4 h-4', md: 'w-5 h-5', lg: 'w-7 h-7' };

  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: stars }, (_, i) => {
        const starVal = (i + 1) * scale;
        const filled = display >= starVal;
        return (
          <motion.button
            key={i}
            type="button"
            disabled={readonly}
            onClick={() => onChange?.(starVal)}
            onMouseEnter={() => !readonly && setHoverVal(starVal)}
            onMouseLeave={() => !readonly && setHoverVal(0)}
            whileHover={!readonly ? { scale: 1.3 } : {}}
            whileTap={!readonly ? { scale: 0.9 } : {}}
            className={`transition-colors ${readonly ? 'cursor-default' : 'cursor-pointer'}`}
            style={{ background: 'none', border: 'none', padding: 0 }}
          >
            {filled ? (
              <StarIcon className={sizes[size]} style={{ color: 'var(--accent)' }} />
            ) : (
              <StarOutline className={sizes[size]} style={{ color: 'var(--text-muted)' }} />
            )}
          </motion.button>
        );
      })}
      {value > 0 && (
        <span className="ml-1.5 text-sm font-bold" style={{ color: 'var(--accent)' }}>
          {value}/{max}
        </span>
      )}
    </div>
  );
}
