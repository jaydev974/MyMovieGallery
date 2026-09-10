import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
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

export function usePageMetadata() {
  const { pathname } = useLocation();

  useEffect(() => {
    const appName = 'MyMovieGallery';
    const metaByPath: Record<string, { title: string; description: string }> = {
      '/': {
        title: 'MyMovieGallery — Your Personal Cinema Universe',
        description:
          'Track, rate, and discover movies with cinematic galleries, intelligent recommendations, and rich analytics.',
      },
      '/login': {
        title: 'Sign in — MyMovieGallery',
        description: 'Sign in to continue tracking your watchlist, ratings, reviews, and recommendations.',
      },
      '/register': {
        title: 'Create account — MyMovieGallery',
        description: 'Create your movie profile to save watchlists, ratings, favorites, and watched history.',
      },
      '/forgot-password': {
        title: 'Reset password — MyMovieGallery',
        description: 'Recover access to your MyMovieGallery account and continue your movie journey.',
      },
      '/dashboard': {
        title: 'Dashboard — MyMovieGallery',
        description: 'See your latest movie activity, recommendations, and collection overview in one place.',
      },
      '/movies': {
        title: 'Movie Gallery — MyMovieGallery',
        description: 'Browse your personal movie library, ratings, favorites, and watched history.',
      },
      '/search': {
        title: 'Search Movies — MyMovieGallery',
        description: 'Search across movies and metadata to find exactly what you want to watch next.',
      },
      '/recommendations': {
        title: 'Recommendations — MyMovieGallery',
        description: 'Discover movie suggestions tailored to your taste, ratings, and watch history.',
      },
      '/analytics': {
        title: 'Analytics — MyMovieGallery',
        description: 'Review your movie habits, trends, and collection insights with visual analytics.',
      },
      '/watchlist': {
        title: 'Watchlist — MyMovieGallery',
        description: 'Keep track of the movies you want to watch next.',
      },
      '/watched': {
        title: 'Watched — MyMovieGallery',
        description: 'Review movies you have already watched and rated.',
      },
      '/reviews': {
        title: 'Reviews — MyMovieGallery',
        description: 'Browse and manage your written reviews across your movie collection.',
      },
      '/profile': {
        title: 'Profile — MyMovieGallery',
        description: 'Edit your profile, privacy settings, and account information.',
      },
      '/settings': {
        title: 'Settings — MyMovieGallery',
        description: 'Adjust preferences, theme, privacy, and application settings.',
      },
    };

    const fallback = {
      title: 'MyMovieGallery',
      description: 'A cinematic movie gallery for tracking, rating, and discovering movies.',
    };
    const { title, description } = metaByPath[pathname] ?? fallback;
    const fullTitle = title.includes(appName) ? title : `${title} | ${appName}`;

    document.title = fullTitle;

    const ensureMeta = (selector: string, attr: string, value: string) => {
      let element = document.head.querySelector<HTMLMetaElement>(selector);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attr, selector.includes('property=') ? selector.match(/property="([^"]+)"/)?.[1] ?? '' : selector.match(/name="([^"]+)"/)?.[1] ?? '');
        document.head.appendChild(element);
      }
      if (selector.includes('property=')) {
        element.setAttribute('property', selector.match(/property="([^"]+)"/)?.[1] ?? '');
      } else {
        element.setAttribute('name', selector.match(/name="([^"]+)"/)?.[1] ?? '');
      }
      element.setAttribute('content', value);
    };

    ensureMeta('meta[name="description"]', 'name', description);
    ensureMeta('meta[property="og:title"]', 'property', fullTitle);
    ensureMeta('meta[property="og:description"]', 'property', description);
    ensureMeta('meta[name="twitter:title"]', 'name', fullTitle);
    ensureMeta('meta[name="twitter:description"]', 'name', description);

    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', `${window.location.origin}${pathname}`);
  }, [pathname]);
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
