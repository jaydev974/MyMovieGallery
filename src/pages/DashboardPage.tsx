import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useAuthStore } from '../store/authStore';
import { useMovieStore } from '../store/movieStore';
import MovieCarousel from '../components/ui/MovieCarousel';
import StatCard from '../components/ui/StatCard';
import { GENRE_DISTRIBUTION } from '../utils/mockData';
import { formatDateShort } from '../utils/formatters';
import { pageVariants, pageTransition } from '../animations/variants';

function PageWrapper({ children }: { children: React.ReactNode }) {
  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={pageTransition}>
      {children}
    </motion.div>
  );
}

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { movies, getWatchedMovies } = useMovieStore();
  const watchedMovies = getWatchedMovies();
  const recentMovies = watchedMovies.slice(0, 10);
  const allMovies = movies.slice(0, 10);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const weekData = [
    { day: 'Mon', watched: 1 },
    { day: 'Tue', watched: 0 },
    { day: 'Wed', watched: 2 },
    { day: 'Thu', watched: 1 },
    { day: 'Fri', watched: 3 },
    { day: 'Sat', watched: 4 },
    { day: 'Sun', watched: 2 },
  ];

  return (
    <PageWrapper>
      <div className="min-h-screen relative" style={{ background: 'var(--bg)' }}>
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 left-0 w-96 h-96 rounded-full blur-3xl opacity-5"
            style={{ background: 'var(--accent)' }} />
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl opacity-5"
            style={{ background: 'var(--accent-secondary)' }} />
        </div>

        <div className="relative z-10 p-6 max-w-7xl mx-auto space-y-8">
          {/* ─── Welcome Hero ──────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="glass-card p-6 md:p-8 relative overflow-hidden"
          >
            <div className="absolute inset-0 opacity-5"
              style={{ background: user?.avatarColor || 'var(--accent)' }} />
            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-black"
                  style={{ background: user?.avatarColor || 'var(--accent)', color: '#000' }}>
                  {user?.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{greeting} 👋</p>
                  <h1 className="text-2xl font-black" style={{ fontFamily: 'Poppins, sans-serif', color: 'var(--text)' }}>
                    {user?.name}
                  </h1>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{ background: 'var(--accent)' + '22', color: 'var(--accent)' }}>
                      🔥 {user?.watchStreak}-day streak
                    </span>
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      Member since {formatDateShort(user?.joinedDate || '')}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <Link to="/movies"
                  className="px-4 py-2 rounded-xl text-sm font-semibold no-underline"
                  style={{ background: 'var(--accent)', color: '#000' }}>
                  + Add Movie
                </Link>
                <Link to="/recommendations"
                  className="px-4 py-2 rounded-xl text-sm font-semibold no-underline"
                  style={{ background: 'var(--card-secondary)', border: '1px solid var(--border)', color: 'var(--text)' }}>
                  Discover
                </Link>
              </div>
            </div>
          </motion.div>

          {/* ─── Stats Row ─────────────────────────────────────────── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Movies Watched" value={user?.totalWatched || 0} icon="🎬" color="var(--accent)" delay={0} />
            <StatCard label="Reviews" value={user?.totalReviews || 0} icon="✍️" delay={0.1} />
            <StatCard label="Ratings Given" value={user?.totalRatings || 0} icon="⭐" delay={0.2} />
            <StatCard label="Watch Streak" value={user?.watchStreak || 0} suffix=" days" icon="🔥" delay={0.3} />
          </div>

          {/* ─── Charts Row ────────────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Weekly Activity */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="glass-card p-6"
            >
              <h3 className="font-bold mb-4" style={{ fontFamily: 'Poppins, sans-serif', color: 'var(--text)' }}>
                📅 This Week
              </h3>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={weekData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="day" tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
                  <YAxis tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
                  <Tooltip
                    contentStyle={{
                      background: 'var(--card)',
                      border: '1px solid var(--border)',
                      borderRadius: 12,
                      color: 'var(--text)',
                    }}
                  />
                  <Bar dataKey="watched" fill="var(--accent)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>

            {/* Genre Distribution */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="glass-card p-6"
            >
              <h3 className="font-bold mb-4" style={{ fontFamily: 'Poppins, sans-serif', color: 'var(--text)' }}>
                🎭 Genre Split
              </h3>
              <div className="flex items-center gap-4">
                <ResponsiveContainer width={180} height={180}>
                  <PieChart>
                    <Pie data={GENRE_DISTRIBUTION} dataKey="count" cx="50%" cy="50%" innerRadius={50} outerRadius={80}>
                      {GENRE_DISTRIBUTION.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-2">
                  {GENRE_DISTRIBUTION.slice(0, 4).map((g) => (
                    <div key={g.genre} className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: g.color }} />
                      <span className="text-xs flex-1" style={{ color: 'var(--text-secondary)' }}>{g.genre}</span>
                      <span className="text-xs font-bold" style={{ color: 'var(--text-muted)' }}>{g.percentage}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>

          {/* ─── Achievements ──────────────────────────────────────── */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
            className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold" style={{ fontFamily: 'Poppins, sans-serif', color: 'var(--text)' }}>🏆 Achievements</h3>
              <Link to="/profile" className="text-sm no-underline" style={{ color: 'var(--accent)' }}>View all</Link>
            </div>
            <div className="flex flex-wrap gap-3">
              {user?.achievements.map((a) => (
                <motion.div key={a.id}
                  whileHover={{ scale: 1.05 }}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl"
                  style={{
                    background: a.rarity === 'legendary' ? 'var(--accent)' + '22' :
                      a.rarity === 'epic' ? 'rgba(139,92,246,0.2)' :
                      a.rarity === 'rare' ? 'rgba(59,130,246,0.2)' : 'var(--card-secondary)',
                    border: `1px solid ${a.rarity === 'legendary' ? 'var(--accent)' : 'var(--border)'}44`,
                  }}>
                  <span className="text-lg">{a.icon}</span>
                  <div>
                    <p className="text-xs font-bold" style={{ color: 'var(--text)' }}>{a.name}</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{a.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* ─── Movie Carousels ───────────────────────────────────── */}
          {recentMovies.length > 0 && (
            <MovieCarousel title="🕐 Recently Watched" subtitle="Continue your journey" movies={recentMovies} />
          )}
          <MovieCarousel title="✨ Recommended For You" subtitle="Based on your taste" movies={allMovies} />
        </div>
      </div>
    </PageWrapper>
  );
}
