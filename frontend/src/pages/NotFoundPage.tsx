import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import ParticleBackground from '../components/effects/ParticleBackground';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden" style={{ background: 'var(--bg)' }}>
      <ParticleBackground count={40} />

      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="text-center relative z-10 px-4"
      >
        {/* Film Reel 404 */}
        <motion.div
          className="text-8xl sm:text-9xl font-black mb-4 select-none"
          style={{ fontFamily: 'Poppins, sans-serif', color: 'var(--accent)', textShadow: '0 0 60px var(--glow)' }}
          animate={{ rotate: [0, -2, 2, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        >
          4🎬4
        </motion.div>

        <h1 className="text-2xl sm:text-3xl font-black mb-4"
          style={{ fontFamily: 'Poppins, sans-serif', color: 'var(--text)' }}>
          Scene Not Found
        </h1>

        <p className="text-base sm:text-lg mb-8 max-w-md mx-auto leading-relaxed"
          style={{ color: 'var(--text-muted)' }}>
          Looks like this scene was left on the cutting room floor. The page you're looking for doesn't exist.
        </p>

        <div className="flex flex-wrap gap-4 justify-center">
          <Link to="/"
            className="px-6 py-3 rounded-2xl font-bold text-base no-underline transition-all hover:scale-105"
            style={{ background: 'var(--accent)', color: '#000', boxShadow: '0 0 30px var(--glow)' }}>
            🏠 Back to Home
          </Link>
          <Link to="/movies"
            className="px-6 py-3 rounded-2xl font-bold text-base no-underline transition-all hover:scale-105"
            style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--text)' }}>
            🎬 Browse Movies
          </Link>
        </div>

        {/* Floating posters */}
        <div className="absolute inset-0 pointer-events-none">
          {[0, 1, 2, 3].map((i) => (
            <motion.div key={i}
              className="absolute w-16 h-24 rounded-xl opacity-10"
              style={{
                background: `linear-gradient(${45 + i * 90}deg, var(--accent), var(--accent-secondary))`,
                left: `${10 + i * 25}%`,
                top: `${20 + (i % 2) * 40}%`,
              }}
              animate={{
                y: [0, -20, 0],
                rotate: [-5 + i * 3, 5 - i * 3, -5 + i * 3],
              }}
              transition={{ duration: 3 + i, repeat: Infinity, ease: 'easeInOut' }}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
}
