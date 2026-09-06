import { useEffect, useState } from 'react';
import { useThemeStore } from '../store/themeStore';

export function useTheme() {
  const { theme, themeName, setTheme } = useThemeStore();

  useEffect(() => {
    const root = document.documentElement;
    const c = theme.colors;
    root.style.setProperty('--bg', c.background);
    root.style.setProperty('--bg-secondary', c.backgroundSecondary);
    root.style.setProperty('--card', c.card);
    root.style.setProperty('--card-secondary', c.cardSecondary);
    root.style.setProperty('--accent', c.accent);
    root.style.setProperty('--accent-secondary', c.accentSecondary);
    root.style.setProperty('--text', c.text);
    root.style.setProperty('--text-secondary', c.textSecondary);
    root.style.setProperty('--text-muted', c.textMuted);
    root.style.setProperty('--border', c.border);
    root.style.setProperty('--glow', c.glow);
    root.style.setProperty('--navbar', c.navbar);
    root.style.setProperty('--sidebar', c.sidebar);
    root.style.setProperty('--success', c.success);
    root.style.setProperty('--warning', c.warning);
    root.style.setProperty('--danger', c.danger);
    document.documentElement.setAttribute('data-theme', themeName);
  }, [theme, themeName]);

  return { theme, themeName, setTheme };
}

export function useScrolled(threshold = 20) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > threshold);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, [threshold]);
  return scrolled;
}

export function useDebounce<T>(value: T, delay = 400): T {
  const [dv, setDv] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDv(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return dv;
}

export function useIntersectionObserver(threshold = 0.1) {
  const [ref, setRef] = useState<Element | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  useEffect(() => {
    if (!ref) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setIsVisible(true);
    }, { threshold });
    observer.observe(ref);
    return () => observer.disconnect();
  }, [ref, threshold]);
  return { setRef, isVisible };
}

export function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(() => typeof window !== 'undefined' && window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [query]);
  return matches;
}
