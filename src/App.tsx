import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import AppRoutes from './routes/AppRoutes';
import { ToastContainer } from './components/ui/Toast';
import { useTheme } from './hooks';
import './styles/globals.css';

function ThemeInjector({ children }: { children: React.ReactNode }) {
  useTheme();
  return <>{children}</>;
}

export default function App() {
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
