import { useState } from 'react';
import { motion } from 'framer-motion';
import { useThemeStore } from '../store/themeStore';
import { useAuthStore } from '../store/authStore';
import { useToast } from '../components/ui/useToast';
import { themes } from '../themes/themes';
import { pageVariants, pageTransition, staggerItem } from '../animations/variants';
import type { ThemeName } from '../types';

const THEME_ICONS: Record<string, string> = {
  'hollywood-dark': '🎬',
  'midnight-noir': '🌃',
  'oscar-gold': '🏆',
  'neon-hollywood': '🌆',
  'classic-cinema': '🎞',
};

export default function SettingsPage() {
  const { themeName, setTheme } = useThemeStore();
  useAuthStore();
  const toast = useToast();
  const [notifications, setNotifications] = useState({ recommendations: true, reviews: true, achievements: true, newsletter: false });
  const [language, setLanguage] = useState('en');
  const [privacy, setPrivacy] = useState({ profilePublic: true, watchlistPublic: false, ratingsPublic: true });

  function handleExport() {
    toast.success('Data exported!', 'Your data has been downloaded as JSON');
  }

  function handleImport() {
    toast.info('Import feature', 'Coming soon!');
  }

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={pageTransition}
      className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <div className="max-w-3xl mx-auto px-4 py-10 space-y-8">

        <div>
          <h1 className="text-3xl font-black" style={{ fontFamily: 'Poppins, sans-serif', color: 'var(--text)' }}>
            ⚙️ Settings
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Customize your experience</p>
        </div>

        {/* ─── Theme Selector ──────────────────────────────────────── */}
        <motion.div variants={staggerItem} initial="initial" animate="animate" className="glass-card p-6">
          <h2 className="font-bold mb-4" style={{ fontFamily: 'Poppins, sans-serif', color: 'var(--text)' }}>
            🎨 Theme
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.entries(themes).map(([key, t]) => (
              <motion.button
                key={key}
                onClick={() => { setTheme(key as ThemeName); toast.success(`Theme: ${t.label}`); }}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="p-4 rounded-2xl text-left transition-all"
                style={{
                  background: themeName === key ? 'var(--accent)' + '22' : 'var(--card-secondary)',
                  border: `2px solid ${themeName === key ? 'var(--accent)' : 'var(--border)'}`,
                }}
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">{THEME_ICONS[key]}</span>
                  <div>
                    <p className="font-bold text-sm" style={{ color: themeName === key ? 'var(--accent)' : 'var(--text)' }}>{t.label}</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{t.description}</p>
                  </div>
                </div>
                {/* Color preview */}
                <div className="flex gap-1 mt-2">
                  {[t.colors.background, t.colors.card, t.colors.accent, t.colors.accentSecondary].map((c, i) => (
                    <div key={i} className="w-6 h-6 rounded-lg border border-white/10" style={{ background: c }} />
                  ))}
                </div>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* ─── Notifications ───────────────────────────────────────── */}
        <div className="glass-card p-6">
          <h2 className="font-bold mb-4" style={{ fontFamily: 'Poppins, sans-serif', color: 'var(--text)' }}>
            🔔 Notifications
          </h2>
          <div className="space-y-4">
            {Object.entries(notifications).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium capitalize" style={{ color: 'var(--text)' }}>
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    Receive {key} notifications
                  </p>
                </div>
                <button
                  onClick={() => setNotifications((p) => ({ ...p, [key]: !value }))}
                  className="relative w-12 h-6 rounded-full transition-all"
                  style={{ background: value ? 'var(--accent)' : 'var(--card-secondary)', border: '1px solid var(--border)' }}
                >
                  <motion.div
                    className="w-5 h-5 rounded-full absolute top-0.5"
                    animate={{ left: value ? '24px' : '2px' }}
                    transition={{ duration: 0.2 }}
                    style={{ background: value ? '#000' : 'var(--text-muted)' }}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* ─── Language ────────────────────────────────────────────── */}
        <div className="glass-card p-6">
          <h2 className="font-bold mb-4" style={{ fontFamily: 'Poppins, sans-serif', color: 'var(--text)' }}>
            🌐 Language
          </h2>
          <select value={language} onChange={(e) => setLanguage(e.target.value)}
            className="w-full px-4 py-3 rounded-xl outline-none"
            style={{ background: 'var(--card-secondary)', border: '1px solid var(--border)', color: 'var(--text)' }}>
            <option value="en">English</option>
            <option value="es">Español</option>
            <option value="fr">Français</option>
            <option value="de">Deutsch</option>
            <option value="ja">日本語</option>
            <option value="ko">한국어</option>
          </select>
        </div>

        {/* ─── Privacy ─────────────────────────────────────────────── */}
        <div className="glass-card p-6">
          <h2 className="font-bold mb-4" style={{ fontFamily: 'Poppins, sans-serif', color: 'var(--text)' }}>
            🔒 Privacy
          </h2>
          <div className="space-y-4">
            {Object.entries(privacy).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between">
                <p className="text-sm font-medium capitalize" style={{ color: 'var(--text)' }}>
                  {key.replace(/([A-Z])/g, ' $1').replace('Public', ' is public').trim()}
                </p>
                <button
                  onClick={() => setPrivacy((p) => ({ ...p, [key]: !value }))}
                  className="relative w-12 h-6 rounded-full transition-all"
                  style={{ background: value ? 'var(--accent)' : 'var(--card-secondary)', border: '1px solid var(--border)' }}
                >
                  <motion.div
                    className="w-5 h-5 rounded-full absolute top-0.5"
                    animate={{ left: value ? '24px' : '2px' }}
                    transition={{ duration: 0.2 }}
                    style={{ background: value ? '#000' : 'var(--text-muted)' }}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* ─── Data ────────────────────────────────────────────────── */}
        <div className="glass-card p-6">
          <h2 className="font-bold mb-4" style={{ fontFamily: 'Poppins, sans-serif', color: 'var(--text)' }}>
            💾 Data Management
          </h2>
          <div className="flex flex-wrap gap-3">
            <motion.button
              onClick={handleExport}
              whileHover={{ scale: 1.02 }}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold"
              style={{ background: 'var(--card-secondary)', border: '1px solid var(--border)', color: 'var(--text)' }}>
              📥 Export Data
            </motion.button>
            <motion.button
              onClick={handleImport}
              whileHover={{ scale: 1.02 }}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold"
              style={{ background: 'var(--card-secondary)', border: '1px solid var(--border)', color: 'var(--text)' }}>
              📤 Import Data
            </motion.button>
          </div>
        </div>

        {/* ─── Danger Zone ─────────────────────────────────────────── */}
        <div className="glass-card p-6" style={{ borderColor: 'var(--danger)' }}>
          <h2 className="font-bold mb-2" style={{ fontFamily: 'Poppins, sans-serif', color: 'var(--danger)' }}>
            ⚠️ Danger Zone
          </h2>
          <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
            Once you delete your account, there is no going back. Please be certain.
          </p>
          <motion.button
            whileHover={{ scale: 1.02 }}
            className="px-4 py-2.5 rounded-xl text-sm font-bold"
            style={{ background: 'var(--danger)' + '22', border: '1px solid var(--danger)', color: 'var(--danger)' }}
            onClick={() => toast.warning('This is a demo', 'Account deletion is not available in demo mode')}>
            Delete Account
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
