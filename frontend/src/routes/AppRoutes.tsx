import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

// Layouts
import RootLayout from '../layouts/RootLayout';
import AuthLayout from '../layouts/AuthLayout';
import AppLayout from '../layouts/AppLayout';

// Pages — lazy loaded
const LandingPage = React.lazy(() => import('../pages/LandingPage'));
const LoginPage = React.lazy(() => import('../pages/auth/LoginPage'));
const RegisterPage = React.lazy(() => import('../pages/auth/RegisterPage'));
const ForgotPasswordPage = React.lazy(() => import('../pages/auth/ForgotPasswordPage'));
const DashboardPage = React.lazy(() => import('../pages/DashboardPage'));
const MovieGalleryPage = React.lazy(() => import('../pages/MovieGalleryPage'));
const MovieDetailPage = React.lazy(() => import('../pages/MovieDetailPage'));
const SearchPage = React.lazy(() => import('../pages/SearchPage'));
const RecommendationsPage = React.lazy(() => import('../pages/RecommendationsPage'));
const AnalyticsPage = React.lazy(() => import('../pages/AnalyticsPage'));
const WatchlistPage = React.lazy(() => import('../pages/WatchlistPage'));
const WatchedPage = React.lazy(() => import('../pages/WatchedPage'));
const PublicProfilePage = React.lazy(() => import('../pages/PublicProfilePage'));
const ReviewsPage = React.lazy(() => import('../pages/ReviewsPage'));
const ProfilePage = React.lazy(() => import('../pages/ProfilePage'));
const SettingsPage = React.lazy(() => import('../pages/SettingsPage'));
const NotFoundPage = React.lazy(() => import('../pages/NotFoundPage'));

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthStore();
  if (isLoading) return <LoadingFallback />;
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  return !isAuthenticated ? <>{children}</> : <Navigate to="/dashboard" replace />;
}

export default function AppRoutes() {
  return (
    <React.Suspense fallback={<LoadingFallback />}>
      <Routes>
        {/* Public Landing */}
        <Route element={<RootLayout />}>
          <Route index element={<LandingPage />} />
          <Route path="/users/:username" element={<PublicProfilePage />} />
        </Route>

        {/* Auth Routes */}
        <Route element={<PublicOnlyRoute><AuthLayout /></PublicOnlyRoute>}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        </Route>

        {/* Protected App Routes */}
        <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/movies" element={<MovieGalleryPage />} />
          <Route path="/movies/:id" element={<MovieDetailPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/recommendations" element={<RecommendationsPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/watchlist" element={<WatchlistPage />} />
          <Route path="/watched" element={<WatchedPage />} />
          <Route path="/reviews" element={<ReviewsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </React.Suspense>
  );
}

function LoadingFallback() {
  return (
    <div className="fixed inset-0 flex items-center justify-center" style={{ background: 'var(--bg)' }}>
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-4 border-transparent" style={{ borderTopColor: 'var(--accent)', animation: 'spin 1s linear infinite' }} />
          <div className="absolute inset-2 rounded-full border-4 border-transparent" style={{ borderTopColor: 'var(--accent-secondary)', animation: 'spin 1.5s linear infinite reverse' }} />
        </div>
        <p style={{ color: 'var(--text-muted)', fontFamily: 'Poppins, sans-serif', fontSize: '14px' }}>Loading Cinema…</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
