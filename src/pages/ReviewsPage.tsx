import { useState } from 'react';
import { motion } from 'framer-motion';
import { useMovieStore } from '../store/movieStore';
import { useAuthStore } from '../store/authStore';
import { useToast } from '../components/ui/useToast';
import { MOCK_REVIEWS } from '../utils/mockData';
import { pageVariants, pageTransition, staggerContainer, staggerItem } from '../animations/variants';
import { formatDateShort, getRatingColor } from '../utils/formatters';
import { HeartIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolid } from '@heroicons/react/24/solid';
import type { Review } from '../types';

export default function ReviewsPage() {
  const { user } = useAuthStore();
  const { movies, reviews, addReview, likeReview } = useMovieStore();
  const toast = useToast();
  const [filter, setFilter] = useState<'all' | 'mine'>('all');
  const [showForm, setShowForm] = useState(false);
  const [newReview, setNewReview] = useState({ movieId: 0, rating: 8, title: '', content: '', containsSpoilers: false });

  const allReviews = [...MOCK_REVIEWS, ...reviews];
  const displayReviews = filter === 'mine' ? allReviews.filter((r) => r.userId === user?.id) : allReviews;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!newReview.movieId || !newReview.title || !newReview.content) return;
    const review: Review = {
      id: `r-${Date.now()}`,
      movieId: newReview.movieId,
      userId: user?.id || '',
      userName: user?.name || '',
      rating: newReview.rating,
      title: newReview.title,
      content: newReview.content,
      likes: 0,
      createdAt: new Date().toISOString().split('T')[0],
      containsSpoilers: newReview.containsSpoilers,
      tags: [],
    };
    addReview(review);
    toast.success('Review published! 🎬');
    setShowForm(false);
    setNewReview({ movieId: 0, rating: 8, title: '', content: '', containsSpoilers: false });
  }

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={pageTransition}
      className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <div className="max-w-4xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black" style={{ fontFamily: 'Poppins, sans-serif', color: 'var(--text)' }}>
              ✍️ Reviews
            </h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>{displayReviews.length} reviews</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
              {(['all', 'mine'] as const).map((f) => (
                <button key={f} onClick={() => setFilter(f)}
                  className="px-4 py-2 text-sm font-medium capitalize"
                  style={{ background: filter === f ? 'var(--accent)' : 'var(--card)', color: filter === f ? '#000' : 'var(--text-muted)' }}>
                  {f === 'all' ? 'All Reviews' : 'My Reviews'}
                </button>
              ))}
            </div>
            <motion.button
              onClick={() => setShowForm((p) => !p)}
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              className="px-4 py-2 rounded-xl text-sm font-bold"
              style={{ background: 'var(--accent)', color: '#000' }}>
              + Write Review
            </motion.button>
          </div>
        </div>

        {/* Write Review Form */}
        {showForm && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
            className="glass-card p-6 mb-6">
            <h3 className="font-bold mb-4" style={{ color: 'var(--text)' }}>Write a Review</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <select value={newReview.movieId} onChange={(e) => setNewReview((p) => ({ ...p, movieId: Number(e.target.value) }))}
                className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                style={{ background: 'var(--card-secondary)', border: '1px solid var(--border)', color: 'var(--text)' }} required>
                <option value={0}>Select a movie…</option>
                {movies.map((m) => <option key={m.id} value={m.id}>{m.title}</option>)}
              </select>
              <input value={newReview.title} onChange={(e) => setNewReview((p) => ({ ...p, title: e.target.value }))}
                placeholder="Review title…" required
                className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                style={{ background: 'var(--card-secondary)', border: '1px solid var(--border)', color: 'var(--text)' }} />
              <textarea value={newReview.content} onChange={(e) => setNewReview((p) => ({ ...p, content: e.target.value }))}
                placeholder="Share your thoughts…" rows={4} required
                className="w-full px-4 py-2.5 rounded-xl text-sm outline-none resize-none"
                style={{ background: 'var(--card-secondary)', border: '1px solid var(--border)', color: 'var(--text)' }} />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Rating:</span>
                  <input type="range" min={1} max={10} value={newReview.rating}
                    onChange={(e) => setNewReview((p) => ({ ...p, rating: Number(e.target.value) }))}
                    className="w-24" style={{ accentColor: 'var(--accent)' }} />
                  <span className="font-bold text-sm" style={{ color: 'var(--accent)' }}>{newReview.rating}/10</span>
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setShowForm(false)}
                    className="px-4 py-2 rounded-xl text-sm font-medium"
                    style={{ background: 'var(--card-secondary)', color: 'var(--text-muted)' }}>
                    Cancel
                  </button>
                  <button type="submit" className="px-4 py-2 rounded-xl text-sm font-bold"
                    style={{ background: 'var(--accent)', color: '#000' }}>
                    Publish
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        )}

        {/* Reviews List */}
        <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-4">
          {displayReviews.map((review) => {
            const movie = movies.find((m) => m.id === review.movieId);
            const ratingColor = getRatingColor(review.rating);
            return (
              <motion.div key={review.id} variants={staggerItem} className="glass-card p-6 hover:scale-[1.01] transition-transform">
                {/* Review Header */}
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-secondary))', color: '#000' }}>
                    {review.userName.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-bold text-sm" style={{ color: 'var(--text)' }}>{review.userName}</span>
                        {movie && <span className="text-xs ml-2" style={{ color: 'var(--text-muted)' }}>on <span style={{ color: 'var(--accent)' }}>{movie.title}</span></span>}
                      </div>
                      <div className="flex items-center gap-1 px-2 py-1 rounded-lg text-sm font-bold"
                        style={{ background: ratingColor + '22', color: ratingColor }}>
                        ⭐ {review.rating}/10
                      </div>
                    </div>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{formatDateShort(review.createdAt)}</p>
                  </div>
                </div>

                {/* Review Content */}
                <h3 className="font-bold mb-2" style={{ color: 'var(--text)' }}>{review.title}</h3>
                {review.containsSpoilers && (
                  <p className="text-xs mb-2 px-2 py-1 rounded-lg inline-block"
                    style={{ background: 'var(--warning)' + '22', color: 'var(--warning)' }}>
                    ⚠️ Contains Spoilers
                  </p>
                )}
                <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--text-secondary)' }}>
                  {review.content}
                </p>

                {/* Tags */}
                {review.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {review.tags.map((t) => (
                      <span key={t} className="text-xs px-2 py-0.5 rounded-full"
                        style={{ background: 'var(--card-secondary)', color: 'var(--text-muted)' }}>
                        #{t}
                      </span>
                    ))}
                  </div>
                )}

                {/* Like */}
                <button onClick={() => likeReview(review.id)}
                  className="flex items-center gap-1.5 text-sm transition-all hover:scale-105"
                  style={{ color: review.isLiked ? 'var(--danger)' : 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                  {review.isLiked ? <HeartSolid className="w-4 h-4" /> : <HeartIcon className="w-4 h-4" />}
                  <span>{review.likes} helpful</span>
                </button>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </motion.div>
  );
}
