import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useToast } from '../../components/ui/useToast';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1500));
    setLoading(false);
    setSent(true);
    toast.success('Reset link sent!', 'Check your email inbox');
  }

  return (
    <div>
      <div className="text-center mb-8">
        <div className="text-4xl mb-4">🔑</div>
        <h1 className="text-2xl font-black mb-2" style={{ fontFamily: 'Poppins, sans-serif', color: 'var(--text)' }}>
          {sent ? 'Check your email' : 'Forgot Password?'}
        </h1>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          {sent ? `We sent a reset link to ${email}` : "No worries, we'll send you reset instructions."}
        </p>
      </div>

      {!sent ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com" required
              className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
              style={{ background: 'var(--card-secondary)', border: '1px solid var(--border)', color: 'var(--text)' }}
              onFocus={(e) => { e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 0 3px var(--glow)'; }}
              onBlur={(e) => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none'; }}
            />
          </div>
          <motion.button type="submit" disabled={loading}
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            className="w-full py-3 rounded-xl font-bold text-sm"
            style={{ background: 'var(--accent)', color: '#000', opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Sending…' : 'Send Reset Link'}
          </motion.button>
        </form>
      ) : (
        <div className="text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: 'var(--success)' + '22', border: '2px solid var(--success)' }}>
            <span className="text-2xl">✓</span>
          </div>
          <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
            Didn't receive the email? Check spam or try again.
          </p>
          <button onClick={() => setSent(false)}
            className="px-6 py-2 rounded-xl text-sm font-semibold"
            style={{ background: 'var(--card-secondary)', border: '1px solid var(--border)', color: 'var(--text)' }}>
            Try again
          </button>
        </div>
      )}

      <p className="text-center text-sm mt-6" style={{ color: 'var(--text-muted)' }}>
        <Link to="/login" className="font-bold no-underline" style={{ color: 'var(--accent)' }}>← Back to sign in</Link>
      </p>
    </div>
  );
}
