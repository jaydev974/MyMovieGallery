import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import ParticleBackground from '../components/effects/ParticleBackground';
import GradientOrbs from '../components/effects/GradientOrbs';
import MovieCarousel from '../components/ui/MovieCarousel';
import StatCard from '../components/ui/StatCard';
import { MOCK_MOVIES } from '../utils/mockData';
import { pageVariants, pageTransition, heroTitle, heroSubtitle, heroButtons, staggerContainer, staggerItem, fadeInUp } from '../animations/variants';

const FEATURES = [
  { icon: '🎬', title: 'Personal Movie Gallery', desc: 'Build your digital film library and track every movie you\'ve watched, loved, or want to see.' },
  { icon: '⭐', title: 'Rate & Review', desc: 'Express your cinematic opinions. Rate movies, write reviews, and build your critic profile.' },
  { icon: '🔖', title: 'Smart Watchlist', desc: 'Never forget a movie again. Organize your must-watch list with priorities and expected dates.' },
  { icon: '✨', title: 'AI Recommendations', desc: 'Get personalized movie suggestions based on your taste, genre preferences, and watch history.' },
  { icon: '📊', title: 'Watch Analytics', desc: 'Explore beautiful insights about your viewing habits, favorite genres, and movie stats.' },
  { icon: '🏆', title: 'Achievements', desc: 'Earn badges and achievements as you explore cinema. Become a legendary film connoisseur.' },
];

const TESTIMONIALS = [
  { name: 'Sarah K.', role: 'Film Critic', text: 'The most beautiful movie tracking app I\'ve ever used. It feels like stepping into a cineplex.', avatar: '🎭' },
  { name: 'Marcus L.', role: 'Cinema Enthusiast', text: 'The analytics dashboard is incredible. I finally understand my viewing habits!', avatar: '🎬' },
  { name: 'Priya M.', role: 'Movie Blogger', text: 'The recommendation engine is scary good. It found movies I didn\'t know I needed.', avatar: '🌟' },
];

export default function LandingPage() {
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const trendingMovies = MOCK_MOVIES.slice(0, 10);

  useEffect(() => {
    const t = setInterval(() => setActiveTestimonial((p) => (p + 1) % TESTIMONIALS.length), 4000);
    return () => clearInterval(t);
  }, []);

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={pageTransition}
      className="min-h-screen overflow-x-hidden"
      style={{ background: 'var(--bg)' }}
    >
      {/* ─── Hero Section ──────────────────────────────────────────── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-4 overflow-hidden">
        <ParticleBackground count={80} />
        <GradientOrbs />

        {/* Spotlight effect */}
        <div className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse 80% 60% at 50% 40%, var(--glow) 0%, transparent 70%)',
            opacity: 0.15,
          }}
        />

        {/* Navbar */}
        <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 h-16"
          style={{ background: 'rgba(0,0,0,0.2)', backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm"
              style={{ background: 'var(--accent)', color: '#000' }}>M</div>
            <span className="font-bold" style={{ fontFamily: 'Poppins, sans-serif', color: 'var(--text)' }}>MyMovieGallery</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="px-4 py-2 rounded-xl text-sm font-semibold no-underline transition-all"
              style={{ color: 'var(--text-secondary)' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--accent)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}>
              Sign In
            </Link>
            <Link to="/register"
              className="px-4 py-2 rounded-xl text-sm font-bold no-underline transition-all hover:scale-105"
              style={{ background: 'var(--accent)', color: '#000' }}>
              Get Started
            </Link>
          </div>
        </nav>

        {/* Hero content */}
        <div className="relative z-10 max-w-4xl mx-auto pt-20">
          <motion.div variants={heroTitle} initial="initial" animate="animate">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold mb-6"
              style={{ background: `${`var(--accent)`}22`, border: '1px solid var(--border)', color: 'var(--accent)' }}>
              🎬 Your Personal Cinema Universe
            </div>
            <h1 className="text-5xl sm:text-7xl md:text-8xl font-black mb-4 leading-none tracking-tight"
              style={{ fontFamily: 'Poppins, sans-serif' }}>
              <span style={{ color: 'var(--text)' }}>My</span>
              <span className="gradient-text">Movie</span>
              <br />
              <span style={{ color: 'var(--text)' }}>Gallery</span>
            </h1>
          </motion.div>

          <motion.p
            variants={heroSubtitle} initial="initial" animate="animate"
            className="text-lg sm:text-xl mb-10 max-w-2xl mx-auto leading-relaxed"
            style={{ color: 'var(--text-muted)' }}>
            Track, rate, and discover movies like never before. Build your cinematic universe with beautiful galleries, intelligent recommendations, and stunning analytics.
          </motion.p>

          <motion.div
            variants={heroButtons} initial="initial" animate="animate"
            className="flex flex-wrap items-center justify-center gap-4">
            <Link to="/register"
              className="group flex items-center gap-2 px-8 py-4 rounded-2xl font-bold text-lg no-underline transition-all hover:scale-105"
              style={{ background: 'var(--accent)', color: '#000', boxShadow: '0 0 30px var(--glow)' }}>
              <span>Start Your Collection</span>
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </Link>
            <Link to="/login"
              className="flex items-center gap-2 px-8 py-4 rounded-2xl font-bold text-lg no-underline transition-all hover:scale-105"
              style={{
                background: 'transparent',
                border: '2px solid var(--border)',
                color: 'var(--text)',
              }}>
              Explore Demo
            </Link>
          </motion.div>
        </div>

        {/* Floating movie posters */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {MOCK_MOVIES.slice(0, 6).map((movie, i) => (
            <motion.div
              key={movie.id}
              className="absolute rounded-2xl overflow-hidden opacity-20"
              style={{
                width: 80 + (i % 3) * 20,
                background: movie.posterColor,
                aspectRatio: '2/3',
                left: `${5 + (i * 17) % 90}%`,
                top: `${10 + (i * 23) % 70}%`,
              }}
              animate={{
                y: [0, -15, 0],
                rotate: [-3 + i, 3 - i, -3 + i],
              }}
              transition={{
                duration: 4 + i,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: i * 0.5,
              }}
            />
          ))}
        </div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="flex flex-col items-center gap-2" style={{ color: 'var(--text-muted)' }}>
            <span className="text-xs">Scroll to explore</span>
            <div className="w-5 h-8 rounded-full border-2 flex items-start justify-center pt-1.5"
              style={{ borderColor: 'var(--border)' }}>
              <motion.div className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--accent)' }}
                animate={{ y: [0, 12, 0] }} transition={{ duration: 1.5, repeat: Infinity }} />
            </div>
          </div>
        </motion.div>
      </section>

      {/* ─── Stats Section ─────────────────────────────────────────── */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Movies Tracked" value={15420} icon="🎬" color="var(--accent)" delay={0} />
          <StatCard label="Reviews Written" value={8930} icon="✍️" delay={0.1} />
          <StatCard label="Active Users" value={4200} icon="👥" delay={0.2} />
          <StatCard label="Recommendations" value={52000} icon="✨" delay={0.3} />
        </div>
      </section>

      {/* ─── Trending Carousel ─────────────────────────────────────── */}
      <section className="py-10 px-4">
        <div className="max-w-7xl mx-auto">
          <MovieCarousel
            title="🔥 Trending This Week"
            subtitle="The movies everyone's talking about"
            movies={trendingMovies}
          />
        </div>
      </section>

      {/* ─── Features ──────────────────────────────────────────────── */}
      <section className="py-24 px-4 relative">
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'linear-gradient(180deg, transparent 0%, var(--bg-secondary) 50%, transparent 100%)' }} />
        <div className="max-w-6xl mx-auto relative z-10">
          <motion.div
            variants={fadeInUp} initial="initial" whileInView="animate" viewport={{ once: true }}
            className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4" style={{ fontFamily: 'Poppins, sans-serif', color: 'var(--text)' }}>
              Everything a <span className="gradient-text">Film Lover</span> Needs
            </h2>
            <p className="text-lg" style={{ color: 'var(--text-muted)' }}>
              Built with passion for cinema. Designed for obsessive movie fans.
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer} initial="initial" whileInView="animate" viewport={{ once: true }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f, i) => (
              <motion.div key={i} variants={staggerItem}
                className="glass-card p-6 group hover:scale-105 transition-transform duration-300"
                style={{ cursor: 'default' }}>
                <div className="text-3xl mb-4">{f.icon}</div>
                <h3 className="text-lg font-bold mb-2" style={{ fontFamily: 'Poppins, sans-serif', color: 'var(--text)' }}>
                  {f.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>{f.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── Testimonials ──────────────────────────────────────────── */}
      <section className="py-20 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-black mb-12" style={{ fontFamily: 'Poppins, sans-serif', color: 'var(--text)' }}>
            Loved by <span className="gradient-text">Film Fans</span>
          </h2>
          <motion.div
            key={activeTestimonial}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="glass-card p-8"
          >
            <div className="text-4xl mb-4">{TESTIMONIALS[activeTestimonial].avatar}</div>
            <p className="text-lg italic mb-6" style={{ color: 'var(--text-secondary)', lineHeight: 1.8 }}>
              "{TESTIMONIALS[activeTestimonial].text}"
            </p>
            <div>
              <p className="font-bold" style={{ color: 'var(--text)' }}>{TESTIMONIALS[activeTestimonial].name}</p>
              <p className="text-sm" style={{ color: 'var(--accent)' }}>{TESTIMONIALS[activeTestimonial].role}</p>
            </div>
          </motion.div>
          <div className="flex justify-center gap-2 mt-6">
            {TESTIMONIALS.map((_, i) => (
              <button key={i} onClick={() => setActiveTestimonial(i)}
                className="w-2 h-2 rounded-full transition-all"
                style={{ background: i === activeTestimonial ? 'var(--accent)' : 'var(--border)' }} />
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ───────────────────────────────────────────────────── */}
      <section className="py-24 px-4 relative overflow-hidden">
        <GradientOrbs />
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <motion.div variants={fadeInUp} initial="initial" whileInView="animate" viewport={{ once: true }}>
            <h2 className="text-4xl md:text-5xl font-black mb-6" style={{ fontFamily: 'Poppins, sans-serif', color: 'var(--text)' }}>
              Ready to Build Your <span className="gradient-text">Cinema Universe?</span>
            </h2>
            <p className="text-lg mb-8" style={{ color: 'var(--text-muted)' }}>
              Join thousands of film enthusiasts who track, rate, and discover movies together.
            </p>
            <Link to="/register"
              className="inline-flex items-center gap-2 px-10 py-4 rounded-2xl font-black text-xl no-underline hover:scale-105 transition-transform"
              style={{ background: 'var(--accent)', color: '#000', boxShadow: '0 0 50px var(--glow)' }}>
              🎬 Start Free Today
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ─── Footer ────────────────────────────────────────────────── */}
      <footer className="py-12 px-4" style={{ borderTop: '1px solid var(--border)' }}>
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm"
                style={{ background: 'var(--accent)', color: '#000' }}>M</div>
              <span className="font-bold" style={{ fontFamily: 'Poppins, sans-serif', color: 'var(--text)' }}>MyMovieGallery</span>
            </div>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Your personal cinema universe. Track, rate, and discover.</p>
          </div>
          {[
            { title: 'Product', links: ['Features', 'Pricing', 'Changelog', 'Roadmap'] },
            { title: 'Company', links: ['About', 'Blog', 'Careers', 'Press'] },
            { title: 'Legal', links: ['Privacy', 'Terms', 'Cookies', 'Contact'] },
          ].map((col) => (
            <div key={col.title}>
              <h4 className="font-bold text-sm mb-4" style={{ color: 'var(--text)' }}>{col.title}</h4>
              <ul className="space-y-2">
                {col.links.map((link) => (
                  <li key={link}>
                    <a href="#" className="text-sm no-underline transition-colors"
                      style={{ color: 'var(--text-muted)' }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--accent)')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}>
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="max-w-6xl mx-auto mt-8 pt-8 flex items-center justify-between"
          style={{ borderTop: '1px solid var(--border)' }}>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>© 2026 MyMovieGallery. Made with ❤️ for cinema lovers.</p>
          <div className="flex gap-4">
            {['🐦', '📸', '💼', '📺'].map((icon, i) => (
              <a key={i} href="#" className="text-xl transition-transform hover:scale-125" style={{ textDecoration: 'none' }}>{icon}</a>
            ))}
          </div>
        </div>
      </footer>
    </motion.div>
  );
}
