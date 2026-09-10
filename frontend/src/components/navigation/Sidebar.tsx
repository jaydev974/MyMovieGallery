import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HomeIcon, FilmIcon, BookmarkIcon, SparklesIcon, EyeIcon,
  ChartBarIcon, StarIcon, HeartIcon, Cog6ToothIcon,
  UserIcon, ArrowLeftOnRectangleIcon, ChevronLeftIcon,
  ChevronRightIcon, XMarkIcon,
} from '@heroicons/react/24/outline';
import { useAuthStore } from '../../store/authStore';
import { drawerVariants, fadeIn } from '../../animations/variants';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
  isMobile: boolean;
}

const NAV_ITEMS = [
  { path: '/dashboard', label: 'Dashboard', icon: HomeIcon },
  { path: '/movies', label: 'Movies', icon: FilmIcon },
  { path: '/watchlist', label: 'Watchlist', icon: BookmarkIcon },
  { path: '/watched', label: 'Watched', icon: EyeIcon },
  { path: '/recommendations', label: 'Recommendations', icon: SparklesIcon },
  { path: '/analytics', label: 'Analytics', icon: ChartBarIcon },
  { path: '/reviews', label: 'Reviews', icon: StarIcon },
  { path: '/favorites', label: 'Favorites', icon: HeartIcon },
  { path: '/profile', label: 'Profile', icon: UserIcon },
  { path: '/settings', label: 'Settings', icon: Cog6ToothIcon },
];

function SidebarContent({
  collapsed,
  onToggle,
  onClose,
  isMobile,
}: { collapsed: boolean; onToggle: () => void; onClose?: () => void; isMobile: boolean }) {
  const { user, logout } = useAuthStore();

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between h-16 px-4 flex-shrink-0"
        style={{ borderBottom: '1px solid var(--border)' }}>
        <AnimatePresence mode="wait">
          {(!collapsed || isMobile) && (
            <motion.div
              key="logo-full"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-2 min-w-0"
            >
              <div className="w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center font-black text-sm"
                style={{ background: 'var(--accent)', color: '#000' }}>
                M
              </div>
              <span className="font-bold text-sm truncate" style={{ fontFamily: 'Poppins, sans-serif', color: 'var(--text)' }}>
                MyMovieGallery
              </span>
            </motion.div>
          )}
          {collapsed && !isMobile && (
            <motion.div
              key="logo-icon"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm mx-auto"
              style={{ background: 'var(--accent)', color: '#000' }}
            >
              M
            </motion.div>
          )}
        </AnimatePresence>

        {isMobile ? (
          <button onClick={onClose} className="p-1 rounded-lg" style={{ color: 'var(--text-muted)' }}>
            <XMarkIcon className="w-5 h-5" />
          </button>
        ) : (
          <button
            onClick={onToggle}
            className="p-1 rounded-lg transition-all"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--accent)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
          >
            {collapsed ? <ChevronRightIcon className="w-4 h-4" /> : <ChevronLeftIcon className="w-4 h-4" />}
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={isMobile ? onClose : undefined}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 no-underline group relative"
            style={({ isActive }) => ({
              background: isActive ? `linear-gradient(135deg, var(--accent)22, var(--accent)11)` : 'transparent',
              color: isActive ? 'var(--accent)' : 'var(--text-muted)',
              border: isActive ? '1px solid var(--border)' : '1px solid transparent',
            })}
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full"
                    style={{ background: 'var(--accent)' }}
                    transition={{ duration: 0.2 }}
                  />
                )}
                <item.icon className="w-5 h-5 flex-shrink-0" />
                <AnimatePresence>
                  {(!collapsed || isMobile) && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden whitespace-nowrap"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
                {/* Tooltip when collapsed */}
                {collapsed && !isMobile && (
                  <div
                    className="absolute left-full ml-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-50 whitespace-nowrap"
                    style={{ background: 'var(--card)', color: 'var(--text)', border: '1px solid var(--border)' }}
                  >
                    {item.label}
                  </div>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User + Logout */}
      <div className="p-3 flex-shrink-0" style={{ borderTop: '1px solid var(--border)' }}>
        <div className="flex items-center gap-3 px-2 py-2 rounded-xl mb-1"
          style={{ background: 'var(--card-secondary)' }}>
          <div className="w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center text-xs font-bold"
            style={{ background: user?.avatarColor || 'var(--accent)', color: '#000' }}>
            {user?.name.slice(0, 2).toUpperCase()}
          </div>
          <AnimatePresence>
            {(!collapsed || isMobile) && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="min-w-0"
              >
                <p className="text-xs font-semibold truncate" style={{ color: 'var(--text)' }}>{user?.name}</p>
                <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>@{user?.username}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-xl text-sm transition-all"
          style={{ color: 'var(--text-muted)' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--danger)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
        >
          <ArrowLeftOnRectangleIcon className="w-5 h-5 flex-shrink-0" />
          {(!collapsed || isMobile) && <span>Sign Out</span>}
        </button>
      </div>
    </div>
  );
}

export default function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose, isMobile }: SidebarProps) {
  if (isMobile) {
    return (
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              variants={fadeIn}
              initial="initial"
              animate="animate"
              exit="initial"
              className="fixed inset-0 z-40"
              style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
              onClick={onMobileClose}
            />
            <motion.aside
              variants={drawerVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="fixed left-0 top-0 bottom-0 z-50 w-72"
              style={{ background: 'var(--sidebar)', borderRight: '1px solid var(--border)' }}
            >
              <SidebarContent collapsed={false} onToggle={onToggle} onClose={onMobileClose} isMobile={true} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    );
  }

  return (
    <motion.aside
      className="fixed left-0 top-0 bottom-0 z-40 overflow-hidden"
      animate={{ width: collapsed ? 72 : 260 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      style={{ background: 'var(--sidebar)', borderRight: '1px solid var(--border)' }}
    >
      <SidebarContent collapsed={collapsed} onToggle={onToggle} isMobile={false} />
    </motion.aside>
  );
}
