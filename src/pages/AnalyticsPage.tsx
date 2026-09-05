import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area,
} from 'recharts';
import { MONTHLY_ACTIVITY, GENRE_DISTRIBUTION } from '../utils/mockData';
import StatCard from '../components/ui/StatCard';
import { pageVariants, pageTransition, staggerContainer, staggerItem, fadeInUp } from '../animations/variants';

const DECADE_DATA = [
  { decade: '1970s', count: 3 },
  { decade: '1980s', count: 5 },
  { decade: '1990s', count: 12 },
  { decade: '2000s', count: 18 },
  { decade: '2010s', count: 45 },
  { decade: '2020s', count: 28 },
];

const RATING_DATA = [
  { rating: '1-2', count: 2 },
  { rating: '3-4', count: 5 },
  { rating: '5-6', count: 18 },
  { rating: '7-8', count: 52 },
  { rating: '9-10', count: 34 },
];

const TOP_DIRECTORS = [
  { name: 'Christopher Nolan', count: 6, rating: 9.1 },
  { name: 'Denis Villeneuve', count: 4, rating: 8.6 },
  { name: 'Damien Chazelle', count: 2, rating: 8.7 },
  { name: 'Ari Aster', count: 2, rating: 7.2 },
  { name: 'Francis Ford Coppola', count: 2, rating: 9.2 },
];

const tooltipStyle = {
  contentStyle: {
    background: 'var(--card)',
    border: '1px solid var(--border)',
    borderRadius: 12,
    color: 'var(--text)',
    fontSize: 12,
  },
};

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <motion.div
      variants={staggerItem}
      className="glass-card p-6"
    >
      <h3 className="font-bold mb-5" style={{ fontFamily: 'Poppins, sans-serif', color: 'var(--text)' }}>{title}</h3>
      {children}
    </motion.div>
  );
}

export default function AnalyticsPage() {
  const totalHours = MONTHLY_ACTIVITY.reduce((acc, m) => acc + m.hours, 0);
  const avgPerMonth = Math.round(MONTHLY_ACTIVITY.reduce((acc, m) => acc + m.watched, 0) / 12);

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={pageTransition}
      className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <div className="max-w-7xl mx-auto px-4 py-10 space-y-8">

        {/* Header */}
        <motion.div variants={fadeInUp} initial="initial" animate="animate">
          <h1 className="text-3xl font-black mb-2" style={{ fontFamily: 'Poppins, sans-serif', color: 'var(--text)' }}>
            📊 Your Analytics
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>Deep insights into your cinematic journey</p>
        </motion.div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Total Watched" value={247} icon="🎬" color="var(--accent)" delay={0} />
          <StatCard label="Hours Watched" value={totalHours} suffix="h" icon="⏱️" delay={0.1} />
          <StatCard label="Avg Per Month" value={avgPerMonth} icon="📅" delay={0.2} />
          <StatCard label="Avg Rating" value={84} suffix="%" icon="⭐" delay={0.3} />
        </div>

        {/* Charts Grid */}
        <motion.div variants={staggerContainer} initial="initial" animate="animate"
          className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Monthly Activity */}
          <ChartCard title="📅 Monthly Watch Activity">
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={MONTHLY_ACTIVITY}>
                <defs>
                  <linearGradient id="watchGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                <Tooltip {...tooltipStyle} />
                <Area type="monotone" dataKey="watched" stroke="var(--accent)" fill="url(#watchGrad)" strokeWidth={2} name="Movies" />
                <Area type="monotone" dataKey="reviewed" stroke="var(--accent-secondary)" fill="none" strokeWidth={2} strokeDasharray="4 4" name="Reviews" />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Genre Distribution */}
          <ChartCard title="🎭 Genre Distribution">
            <div className="flex items-center gap-6">
              <ResponsiveContainer width={200} height={200}>
                <PieChart>
                  <Pie data={GENRE_DISTRIBUTION} dataKey="count" cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3}>
                    {GENRE_DISTRIBUTION.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip {...tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2.5">
                {GENRE_DISTRIBUTION.map((g) => (
                  <div key={g.genre} className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: g.color }} />
                    <span className="text-xs flex-1" style={{ color: 'var(--text-secondary)' }}>{g.genre}</span>
                    <span className="text-xs font-bold" style={{ color: 'var(--text-muted)' }}>{g.percentage}%</span>
                    <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--card-secondary)' }}>
                      <div className="h-full rounded-full" style={{ width: `${g.percentage}%`, background: g.color }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </ChartCard>

          {/* Rating Distribution */}
          <ChartCard title="⭐ Rating Distribution">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={RATING_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="rating" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                <Tooltip {...tooltipStyle} />
                <Bar dataKey="count" fill="var(--accent)" radius={[6, 6, 0, 0]} name="Movies" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Decade Preference */}
          <ChartCard title="🕰️ Decade Preference">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={DECADE_DATA} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                <YAxis dataKey="decade" type="category" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} width={50} />
                <Tooltip {...tooltipStyle} />
                <Bar dataKey="count" fill="var(--accent-secondary)" radius={[0, 6, 6, 0]} name="Movies" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Hours Trend */}
          <ChartCard title="⏱️ Watch Hours Trend">
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={MONTHLY_ACTIVITY}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                <Tooltip {...tooltipStyle} />
                <Line type="monotone" dataKey="hours" stroke="var(--accent)" strokeWidth={3} dot={{ fill: 'var(--accent)', r: 4 }} name="Hours" />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Top Directors */}
          <ChartCard title="🎬 Top Directors">
            <div className="space-y-3">
              {TOP_DIRECTORS.map((d, i) => (
                <div key={d.name} className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black flex-shrink-0"
                    style={{ background: i === 0 ? 'var(--accent)' : 'var(--card-secondary)', color: i === 0 ? '#000' : 'var(--text-muted)' }}>
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium truncate" style={{ color: 'var(--text)' }}>{d.name}</span>
                      <span className="text-xs ml-2 flex-shrink-0" style={{ color: 'var(--text-muted)' }}>{d.count} films</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--card-secondary)' }}>
                      <div className="h-full rounded-full" style={{ width: `${(d.count / 6) * 100}%`, background: 'var(--accent)' }} />
                    </div>
                  </div>
                  <span className="text-sm font-bold flex-shrink-0" style={{ color: 'var(--accent)' }}>⭐{d.rating}</span>
                </div>
              ))}
            </div>
          </ChartCard>
        </motion.div>
      </div>
    </motion.div>
  );
}
