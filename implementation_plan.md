# MyMovieGallery — Premium Cinema Frontend

A cinematic, full-featured personal movie gallery application built with React + TypeScript + Vite + Tailwind CSS + Framer Motion. The goal is to deliver a premium, Hollywood-quality frontend that users will immediately recognize as the most beautiful movie app they've ever seen.

---

## Proposed Changes

### Phase 1 — Project Scaffolding & Core Setup

#### [NEW] Project Root
- Initialize with `npx create-vite@latest ./ --template react-ts`
- Install all dependencies: Tailwind CSS, Framer Motion, React Router, React Icons, Recharts, Zustand, etc.

#### [NEW] `tailwind.config.js`
- Custom color palettes for all 5 themes
- Custom font families (Poppins, Inter, Plus Jakarta Sans)
- Custom animation keyframes (film-grain, float, glow, spotlight)
- Extended spacing, border-radius, and shadow utilities

#### [NEW] `src/styles/globals.css`
- CSS custom properties per theme
- Film grain overlay
- Glassmorphism utilities
- Scrollbar styling

#### [NEW] `src/themes/themes.ts`
- 5 theme definitions: Hollywood Dark, Midnight Noir, Oscar Gold, Neon Hollywood, Classic Cinema
- Color tokens per theme (bg, card, accent, secondary, text, glow)

#### [NEW] `src/store/themeStore.ts` (Zustand)
- Active theme state
- Persistence via localStorage
- Toggle/set theme action

#### [NEW] `src/store/authStore.ts` (Zustand)
- User state (mock auth)
- Login/logout/register actions

#### [NEW] `src/store/movieStore.ts` (Zustand)
- Watched movies list
- Watchlist
- Favorites
- Ratings
- Reviews

---

### Phase 2 — Reusable UI Components (`src/components/`)

#### Core Primitives
- `Button.tsx` — variants: primary, ghost, outline, danger; sizes; ripple effect
- `Card.tsx` — glassmorphism card with hover glow
- `Badge.tsx` — genre/status badges with colored variants
- `Avatar.tsx` — user avatar with gradient ring
- `Modal.tsx` — animated modal with backdrop blur
- `Drawer.tsx` — slide-in sidebar drawer
- `Toast.tsx` + `ToastContainer.tsx` — notification toasts
- `Tooltip.tsx` — hover tooltip
- `Dropdown.tsx` — animated dropdown menu
- `Tabs.tsx` — animated tab switcher
- `Accordion.tsx` — collapsible sections

#### Movie-Specific Components
- `MovieCard.tsx` — Large poster card with 3D tilt, hover reveal, quick actions
- `MoviePoster.tsx` — Standalone poster with aspect ratio
- `RatingStars.tsx` — Interactive star rating with animation
- `ProgressRing.tsx` — Circular SVG progress for ratings
- `GenreBadge.tsx` — Colored genre tag
- `MovieCarousel.tsx` — Horizontal scroll carousel with navigation arrows

#### Data Display Components
- `StatCard.tsx` — Animated counter stat card
- `SkeletonLoader.tsx` — Skeleton loading states
- `EmptyState.tsx` — Illustrated empty state
- `SearchBox.tsx` — Animated search with autocomplete
- `Pagination.tsx` — Animated page navigation
- `LoadingScreen.tsx` — Full-screen cinematic loader

#### Background Effects
- `ParticleBackground.tsx` — Canvas-based floating particles
- `GradientOrbs.tsx` — Blurred moving gradient orbs
- `SpotlightEffect.tsx` — Moving spotlight overlay
- `FilmGrainOverlay.tsx` — SVG-based film grain texture

---

### Phase 3 — Layouts (`src/layouts/`)

#### `RootLayout.tsx`
- Theme provider wrapper
- Toast container
- Dynamic CSS variable injection per theme

#### `AuthLayout.tsx`
- Centered glass card
- Cinematic movie backdrop
- Animated particles

#### `AppLayout.tsx`
- Collapsible sidebar + sticky navbar + page content
- Responsive: drawer on mobile, permanent on desktop

#### `Navbar.tsx`
- Transparent → blur on scroll
- Search, theme switcher, notifications, user avatar
- Animated hamburger for mobile

#### `Sidebar.tsx`
- Collapsible with icon+label transitions
- Active route highlight with glow
- Smooth animation via Framer Motion

#### `Footer.tsx`
- Full-featured with social links, quick links, brand

---

### Phase 4 — Pages (`src/pages/`)

#### `LandingPage.tsx`
- Hero: large backdrop, floating posters, animated title
- Feature grid section
- Stats counter section
- Trending carousel
- Testimonials
- CTA section

#### `LoginPage.tsx` / `RegisterPage.tsx` / `ForgotPasswordPage.tsx`
- Glass card auth forms
- Google login button
- Animated floating labels
- Password visibility toggle
- Form validation

#### `DashboardPage.tsx`
- Welcome hero with user info
- Quick stats (animated counters)
- Recently watched row
- Recommended for you row
- Genre pie chart
- Weekly activity bar chart
- Watch streak calendar

#### `MovieGalleryPage.tsx`
- Responsive grid (1→2→3→4→5 cols)
- Filter bar (genre, year, rating, status)
- Sort options
- Search integration
- Infinite scroll / pagination

#### `MovieDetailPage.tsx`
- Full-width backdrop
- Poster + metadata grid
- Cast carousel
- Ratings display
- User review editor
- Related movies row

#### `SearchPage.tsx`
- Animated search hero
- Live results with genre/year/rating filters
- Sort options
- Empty state

#### `RecommendationsPage.tsx`
- "Recommended For You" hero
- Reason chips ("Because you liked Inception")
- Confidence score + similarity %
- Beautiful recommendation cards grid

#### `AnalyticsPage.tsx`
- Recharts: movies/month bar, genre pie, rating distribution, decade preference
- Stat summary cards
- Top directors / actors lists
- Activity heatmap grid

#### `WatchlistPage.tsx`
- Drag-and-drop ordered list (using mouse events)
- Priority indicators
- Expected watch date
- Status tracking

#### `ReviewsPage.tsx`
- Review cards with markdown rendering
- Like/sort/filter functionality
- Write review modal

#### `ProfilePage.tsx`
- Editable profile card
- Achievements / badges
- Favorite actors, directors, genres
- Stats summary

#### `SettingsPage.tsx`
- Theme selector (visual cards for each theme)
- Notifications, language, privacy
- Export/import data
- Danger zone

#### `NotFoundPage.tsx`
- Cinematic 404 with film reel graphic

---

### Phase 5 — Features, Hooks, Services

#### `src/features/movies/`
- Mock movie data (50+ movies with full metadata)
- Movie search/filter/sort utilities

#### `src/features/recommendations/`
- Mock recommendation engine (genre similarity algorithm)
- Confidence score calculation

#### `src/hooks/`
- `useTheme.ts` — theme state hook
- `useMovies.ts` — movie CRUD operations
- `useDebounce.ts` — debounced search
- `useScrollProgress.ts` — scroll-based animations
- `useLocalStorage.ts` — persisted state
- `useIntersectionObserver.ts` — scroll-reveal
- `useTilt.ts` — 3D tilt effect on movie cards

#### `src/animations/`
- `variants.ts` — Framer Motion variant presets
- `transitions.ts` — Transition config presets
- `pageTransitions.ts` — Page-level animation wrappers

#### `src/types/`
- `movie.ts` — Movie interface
- `user.ts` — User interface
- `review.ts` — Review interface
- `theme.ts` — Theme type definitions

#### `src/utils/`
- `formatters.ts` — Date, runtime, rating formatters
- `helpers.ts` — Misc utilities
- `mockData.ts` — 50+ movies with full metadata, users, reviews

---

## Verification Plan

### Automated
- `npm run build` — TypeScript compilation + Vite bundle check
- `npm run dev` — Dev server smoke test

### Manual Verification
- All 5 themes switch correctly and persist
- Landing page hero, carousel, animations render properly
- Auth pages display correctly with glass card effect
- Dashboard charts render with mock data
- Movie gallery grid is responsive and cards have 3D tilt
- Search, filter, sort work on gallery
- Analytics page charts are interactive
- Sidebar collapses/expands smoothly
- Mobile responsive layout works

---

## Open Questions

> [!NOTE]
> This is a **frontend-only** application with rich mock data. No backend API integration is required at this stage. All data is sourced from in-memory mock datasets using Zustand state management with localStorage persistence.

> [!IMPORTANT]
> **Movie Poster Images**: Real movie posters require TMDB API keys. The implementation will use:
> 1. High-quality gradient placeholder posters generated programmatically per genre
> 2. Placeholder image services with cinematic styling
> This ensures the app looks great without requiring API keys.
