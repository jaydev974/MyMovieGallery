import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import { useMovieStore } from '../store/movieStore';
import { useToast } from '../components/ui/useToast';
import { pageVariants, pageTransition, staggerContainer, staggerItem } from '../animations/variants';
import { formatDate, getInitials } from '../utils/formatters';
import { PencilIcon, CheckIcon } from '@heroicons/react/24/outline';

export default function ProfilePage() {
  const { user, updateProfile } = useAuthStore();
  const { getWatchedMovies, getFavoriteMovies, getWatchlistMovies, reviews } = useMovieStore();
  const toast = useToast();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: user?.name || '', bio: user?.bio || '', location: user?.location || '', isPrivate: user?.isPrivate || false });

  const watched = getWatchedMovies();
  const favorites = getFavoriteMovies();
  const watchlist = getWatchlistMovies();

  function saveProfile() {
    updateProfile(form);
    toast.success('Profile updated!');
    setEditing(false);
  }

  const RARITY_COLORS = {
    common: '#94A3B8',
    rare: '#3B82F6',
    epic: '#8B5CF6',
    legendary: 'var(--accent)',
  };

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={pageTransition}
      className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <div className="max-w-4xl mx-auto px-4 py-10 space-y-6">

        {/* Profile Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6 md:p-8">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            {/* Avatar */}
            <div className="relative">
              <div className="w-24 h-24 rounded-2xl flex items-center justify-center text-3xl font-black"
                style={{ background: user?.avatarColor || 'var(--accent)', color: '#000' }}>
                {getInitials(user?.name || 'U')}
              </div>
              <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: 'var(--success)', color: '#fff' }}>
                ✓
              </div>
            </div>

            {/* Info */}
            <div className="flex-1">
              {editing ? (
                <div className="space-y-3">
                  <input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl text-lg font-bold outline-none"
                    style={{ background: 'var(--card-secondary)', border: '1px solid var(--accent)', color: 'var(--text)' }} />
                  <textarea value={form.bio} onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))}
                    rows={2} className="w-full px-3 py-2 rounded-xl text-sm outline-none resize-none"
                    style={{ background: 'var(--card-secondary)', border: '1px solid var(--border)', color: 'var(--text)' }} />
                  <input value={form.location} onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))}
                    placeholder="Location"
                    className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                    style={{ background: 'var(--card-secondary)', border: '1px solid var(--border)', color: 'var(--text)' }} />
                  <label className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-muted)' }}><input type="checkbox" checked={form.isPrivate} onChange={(e) => setForm((p) => ({ ...p, isPrivate: e.target.checked }))} /> Private account</label>
                </div>
              ) : (
                <div>
                  <h1 className="text-2xl font-black" style={{ fontFamily: 'Poppins, sans-serif', color: 'var(--text)' }}>{user?.name}</h1>
                  <p className="text-sm mt-0.5" style={{ color: 'var(--accent)' }}>@{user?.username}</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{user?.isPrivate ? '🔒 Private account' : '🌐 Public profile'} · <a className="no-underline" style={{ color: 'var(--accent)' }} href={`/users/${user?.username}`}>View public profile</a></p>
                  <p className="text-sm mt-2 leading-relaxed" style={{ color: 'var(--text-muted)' }}>{user?.bio}</p>
                  {user?.location && <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>📍 {user.location}</p>}
                  <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                    Member since {formatDate(user?.joinedDate || '')}
                  </p>
                </div>
              )}
            </div>

            {/* Edit Button */}
            <button
              onClick={editing ? saveProfile : () => setEditing(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
              style={{ background: editing ? 'var(--success)' : 'var(--card-secondary)', border: '1px solid var(--border)', color: editing ? '#fff' : 'var(--text)' }}>
              {editing ? <CheckIcon className="w-4 h-4" /> : <PencilIcon className="w-4 h-4" />}
              {editing ? 'Save' : 'Edit Profile'}
            </button>
          </div>
        </motion.div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Watched', value: watched.length, icon: '🎬' },
            { label: 'Favorites', value: favorites.length, icon: '❤️' },
            { label: 'Watchlist', value: watchlist.length, icon: '🔖' },
            { label: 'Reviews', value: reviews.length, icon: '✍️' },
          ].map((s, i) => (
            <motion.div key={s.label}
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.08 }}
              className="glass-card p-4 text-center">
              <div className="text-2xl mb-1">{s.icon}</div>
              <div className="text-xl font-black" style={{ color: 'var(--accent)' }}>{s.value}</div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{s.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Favorites Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: '🎭 Favorite Genre', value: user?.favoriteGenre },
            { label: '⭐ Favorite Actor', value: user?.favoriteActor },
            { label: '🎬 Favorite Director', value: user?.favoriteDirector },
          ].map((f) => (
            <div key={f.label} className="glass-card p-4">
              <p className="text-xs font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>{f.label}</p>
              <p className="font-bold" style={{ color: 'var(--accent)' }}>{f.value}</p>
            </div>
          ))}
        </div>

        {/* Achievements */}
        <div className="glass-card p-6">
          <h2 className="font-bold mb-4" style={{ fontFamily: 'Poppins, sans-serif', color: 'var(--text)' }}>
            🏆 Achievements
          </h2>
          <motion.div variants={staggerContainer} initial="initial" animate="animate"
            className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {user?.achievements.map((a) => (
              <motion.div key={a.id} variants={staggerItem}
                className="flex items-center gap-3 p-3 rounded-xl"
                style={{
                  background: 'var(--card-secondary)',
                  border: `1px solid ${RARITY_COLORS[a.rarity]}33`,
                }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                  style={{ background: RARITY_COLORS[a.rarity] + '22' }}>
                  {a.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm" style={{ color: 'var(--text)' }}>{a.name}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{a.description}</p>
                </div>
                <span className="text-xs font-semibold capitalize px-2 py-0.5 rounded-full flex-shrink-0"
                  style={{ background: RARITY_COLORS[a.rarity] + '22', color: RARITY_COLORS[a.rarity] }}>
                  {a.rarity}
                </span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
