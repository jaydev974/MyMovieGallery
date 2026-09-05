import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Bars3Icon, BellIcon, MagnifyingGlassIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import { useScrolled } from '../../hooks';
import { themes } from '../../themes/themes';
import { getInitials } from '../../utils/formatters';
import type { ThemeName } from '../../types';

const THEME_ICONS: Record<string, string> = {
  'hollywood-dark': '🎬',
  'midnight-noir': '🌃',
  'oscar-gold': '🏆',
  'neon-hollywood': '🌆',
  'classic-cinema': '🎞',
};

export default function Navbar({ onMenuClick }: { onMenuClick: () => void }) {
  const { user, logout } = useAuthStore();
  const { themeName, setTheme } = useThemeStore();
  const scrolled = useScrolled(30);
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQ, setSearchQ] = useState('');
  const [themeOpen, setThemeOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchOpen) searchRef.current?.focus();
  }, [searchOpen]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (searchQ.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQ.trim())}`);
      setSearchOpen(false);
      setSearchQ('');
    }
  }

  return (
    <motion.header
      className="fixed top-0 right-0 left-0 z-50 transition-all duration-300"
      style={{
        background: scrolled ? 'var(--navbar)' : 'transparent',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        borderBottom: scrolled ? '1px solid var(--border)' : '1px solid transparent',
        boxShadow: scrolled ? '0 4px 30px rgba(0,0,0,0.3)' : 'none',
      }}
      initial={{ y: -80 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      <div className="flex items-center justify-between h-16 px-4 md:px-6">
        {/* Left — menu + logo */}
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuClick}
            className="p-2 rounded-xl transition-all duration-200 hover:scale-110"
            style={{ color: 'var(--text-muted)', background: 'transparent' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--accent)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
          >
            <Bars3Icon className="w-6 h-6" />
          </button>
          <Link to="/dashboard" className="flex items-center gap-2 no-underline">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm"
              style={{ background: 'var(--accent)', color: '#000' }}>
              M
            </div>
            <span className="font-bold text-base hidden sm:block"
              style={{ fontFamily: 'Poppins, sans-serif', color: 'var(--text)' }}>
              MyMovieGallery
            </span>
          </Link>
        </div>

        {/* Right — actions */}
        <div className="flex items-center gap-2">
          {/* Search */}
          <AnimatePresence>
            {searchOpen ? (
              <motion.form
                key="search-bar"
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 240, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                onSubmit={handleSearch}
                className="overflow-hidden"
              >
                <input
                  ref={searchRef}
                  value={searchQ}
                  onChange={(e) => setSearchQ(e.target.value)}
                  onBlur={() => { if (!searchQ) setSearchOpen(false); }}
                  placeholder="Search movies…"
                  className="w-full px-4 py-2 rounded-xl text-sm outline-none"
                  style={{
                    background: 'var(--card)',
                    border: '1px solid var(--border)',
                    color: 'var(--text)',
                  }}
                />
              </motion.form>
            ) : (
              <motion.button
                key="search-icon"
                onClick={() => setSearchOpen(true)}
                className="p-2 rounded-xl transition-all duration-200"
                style={{ color: 'var(--text-muted)' }}
                whileHover={{ scale: 1.1, color: 'var(--accent)' }}
              >
                <MagnifyingGlassIcon className="w-5 h-5" />
              </motion.button>
            )}
          </AnimatePresence>

          {/* Notifications */}
          <motion.button
            className="p-2 rounded-xl relative"
            style={{ color: 'var(--text-muted)' }}
            whileHover={{ scale: 1.1 }}
          >
            <BellIcon className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full" style={{ background: 'var(--accent)' }} />
          </motion.button>

          {/* Theme Switcher */}
          <div className="relative">
            <motion.button
              onClick={() => { setThemeOpen((p) => !p); setUserOpen(false); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm"
              style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
              whileHover={{ scale: 1.02 }}
            >
              <span>{THEME_ICONS[themeName]}</span>
              <ChevronDownIcon className="w-3 h-3" />
            </motion.button>

            <AnimatePresence>
              {themeOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 top-full mt-2 w-52 rounded-2xl shadow-2xl overflow-hidden z-50"
                  style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
                >
                  <div className="p-2">
                    <p className="text-xs font-semibold px-2 py-1.5" style={{ color: 'var(--text-muted)' }}>THEMES</p>
                    {Object.entries(themes).map(([key, t]) => (
                      <button
                        key={key}
                        onClick={() => { setTheme(key as ThemeName); setThemeOpen(false); }}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left text-sm transition-all duration-200"
                        style={{
                          background: themeName === key ? 'var(--border)' : 'transparent',
                          color: themeName === key ? 'var(--accent)' : 'var(--text-secondary)',
                        }}
                      >
                        <span>{THEME_ICONS[key]}</span>
                        <div>
                          <div className="font-medium">{t.label}</div>
                          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{t.description}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* User Avatar */}
          <div className="relative">
            <motion.button
              onClick={() => { setUserOpen((p) => !p); setThemeOpen(false); }}
              className="flex items-center gap-2 rounded-xl px-2 py-1.5"
              style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
              whileHover={{ scale: 1.02 }}
            >
              <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold"
                style={{ background: user?.avatarColor || 'var(--accent)', color: '#000' }}>
                {user ? getInitials(user.name) : 'U'}
              </div>
              <span className="text-sm font-medium hidden sm:block" style={{ color: 'var(--text-secondary)' }}>
                {user?.name.split(' ')[0]}
              </span>
            </motion.button>

            <AnimatePresence>
              {userOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 top-full mt-2 w-44 rounded-2xl shadow-2xl z-50 overflow-hidden"
                  style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
                >
                  {[
                    { label: 'Profile', href: '/profile' },
                    { label: 'Settings', href: '/settings' },
                  ].map((item) => (
                    <Link
                      key={item.href}
                      to={item.href}
                      onClick={() => setUserOpen(false)}
                      className="block px-4 py-2.5 text-sm transition-all"
                      style={{ color: 'var(--text-secondary)' }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--accent)')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
                    >
                      {item.label}
                    </Link>
                  ))}
                  <div style={{ borderTop: '1px solid var(--border)' }}>
                    <button
                      onClick={() => { logout(); setUserOpen(false); }}
                      className="w-full px-4 py-2.5 text-sm text-left transition-all"
                      style={{ color: 'var(--danger)' }}
                    >
                      Sign Out
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Click outside handlers */}
      {(themeOpen || userOpen) && (
        <div className="fixed inset-0 z-40" onClick={() => { setThemeOpen(false); setUserOpen(false); }} />
      )}
    </motion.header>
  );
}
