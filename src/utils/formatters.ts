// ─── Date Formatters ──────────────────────────────────────────────────────────
export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
}

export function formatDateShort(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

// ─── Runtime Formatter ────────────────────────────────────────────────────────
export function formatRuntime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

// ─── Money Formatter ──────────────────────────────────────────────────────────
export function formatMoney(amount: number): string {
  if (amount >= 1_000_000_000) return `$${(amount / 1_000_000_000).toFixed(1)}B`;
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(0)}M`;
  return `$${amount.toLocaleString()}`;
}

// ─── Rating Formatter ─────────────────────────────────────────────────────────
export function formatRating(rating: number): string {
  return rating.toFixed(1);
}

export function getRatingColor(rating: number): string {
  if (rating >= 8.5) return '#22c55e';
  if (rating >= 7) return '#f59e0b';
  if (rating >= 5) return '#f97316';
  return '#ef4444';
}

export function getRatingLabel(rating: number): string {
  if (rating >= 9) return 'Masterpiece';
  if (rating >= 8) return 'Excellent';
  if (rating >= 7) return 'Great';
  if (rating >= 6) return 'Good';
  if (rating >= 5) return 'Average';
  return 'Poor';
}

// ─── Status Formatter ─────────────────────────────────────────────────────────
export function formatStatus(status: string): string {
  const map: Record<string, string> = {
    watched: 'Watched',
    watching: 'Watching',
    plan_to_watch: 'Plan to Watch',
    dropped: 'Dropped',
  };
  return map[status] || status;
}

export function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    watched: '#22c55e',
    watching: '#3b82f6',
    plan_to_watch: '#f59e0b',
    dropped: '#ef4444',
  };
  return map[status] || '#888';
}

// ─── Number Formatter ─────────────────────────────────────────────────────────
export function formatNumber(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n.toString();
}

// ─── Truncate Text ────────────────────────────────────────────────────────────
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + '…';
}

// ─── Generate Initials ────────────────────────────────────────────────────────
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

// ─── Genre Color Map ──────────────────────────────────────────────────────────
export const GENRE_COLORS: Record<string, string> = {
  'Action': '#EF4444',
  'Adventure': '#F97316',
  'Animation': '#EC4899',
  'Biography': '#C9A227',
  'Comedy': '#EAB308',
  'Crime': '#6366F1',
  'Documentary': '#14B8A6',
  'Drama': '#8B5CF6',
  'Fantasy': '#A855F7',
  'Horror': '#64748B',
  'History': '#C9A227',
  'Music': '#06B6D4',
  'Mystery': '#6366F1',
  'Romance': '#F43F5E',
  'Sci-Fi': '#3B82F6',
  'Thriller': '#F59E0B',
  'Western': '#78716C',
};
