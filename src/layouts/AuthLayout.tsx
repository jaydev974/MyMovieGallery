import { Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import GradientOrbs from '../components/effects/GradientOrbs';

export default function AuthLayout() {
  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: 'var(--bg)' }}>
      <GradientOrbs />

      {/* Cinematic backdrop grid */}
      <div className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `
            linear-gradient(var(--border) 1px, transparent 1px),
            linear-gradient(90deg, var(--border) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />

      {/* Floating movie title text */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2 text-center z-10">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex items-center gap-2"
        >
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black"
            style={{ background: 'var(--accent)', color: '#000' }}>
            M
          </div>
          <span className="font-bold text-lg" style={{ fontFamily: 'Poppins, sans-serif', color: 'var(--text)' }}>
            MyMovieGallery
          </span>
        </motion.div>
      </div>

      {/* Auth card */}
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="relative z-10 w-full max-w-md mx-4"
      >
        <div className="glass-card p-8 shadow-2xl" style={{ boxShadow: '0 25px 80px rgba(0,0,0,0.6), 0 0 40px var(--glow)' }}>
          <Outlet />
        </div>
      </motion.div>
    </div>
  );
}
