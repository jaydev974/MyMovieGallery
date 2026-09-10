import React, { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import AppRoutes from './routes/AppRoutes';
import { ToastContainer } from './components/ui/Toast';
import { useTheme } from './hooks';
import './styles/globals.css';
import { useAuthStore } from './store/authStore';
import { useMovieStore } from './store/movieStore';

function ThemeInjector({ children }: { children: React.ReactNode }) {
  useTheme();
  return <>{children}</>;
}

export default function App() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const initializeAuth = useAuthStore((state) => state.initialize);
  const loadMovies = useMovieStore((state) => state.loadMovies);
  const loadReviews = useMovieStore((state) => state.loadReviews);

  useEffect(() => {
    void initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    if (!isAuthenticated) return;
    void loadMovies().then(() => loadReviews());
  }, [isAuthenticated, loadMovies, loadReviews]);

  return (
    <BrowserRouter>
      <ThemeInjector>
        <AnimatePresence mode="wait">
          <AppRoutes />
        </AnimatePresence>
        <ToastContainer />
      </ThemeInjector>
    </BrowserRouter>
  );
}
