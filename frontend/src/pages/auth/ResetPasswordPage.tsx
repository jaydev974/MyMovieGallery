import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useToast } from '../../components/ui/useToast';
import { api } from '../../api/client';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const [token, setToken] = useState(searchParams.get('token') || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [updated, setUpdated] = useState(false);
  const toast = useToast();

  const canSubmit = token.trim().length > 0 && password.length >= 8 && password === confirmPassword;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    try {
      await api.post('/api/auth/password-reset/confirm', { token: token.trim(), password });
      setUpdated(true);
      toast.success('Password updated', 'You can now sign in with your new password.');
    } catch (error) {
      toast.error('Could not update password', error instanceof Error ? error.message : 'Please check the token and try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="text-center mb-8">
        <div className="text-4xl mb-4">🔐</div>
        <h1 className="text-2xl font-black mb-2" style={{ fontFamily: 'Poppins, sans-serif', color: 'var(--text)' }}>
          {updated ? 'Password updated' : 'Reset your password'}
        </h1>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          {updated
            ? 'Your account password has been changed successfully.'
            : 'Paste the reset token from your email or the development response, then choose a new password.'}
        </p>
      </div>

      {!updated ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>Reset token</label>
            <input
              type="text"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Paste reset token"
              required
              className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
              style={{ background: 'var(--card-secondary)', border: '1px solid var(--border)', color: 'var(--text)' }}
              onFocus={(e) => { e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 0 3px var(--glow)'; }}
              onBlur={(e) => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none'; }}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>New password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create a new password"
              required
              minLength={8}
              className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
              style={{ background: 'var(--card-secondary)', border: '1px solid var(--border)', color: 'var(--text)' }}
              onFocus={(e) => { e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 0 3px var(--glow)'; }}
              onBlur={(e) => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none'; }}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>Confirm password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repeat the new password"
              required
              minLength={8}
              className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
              style={{ background: 'var(--card-secondary)', border: '1px solid var(--border)', color: 'var(--text)' }}
              onFocus={(e) => { e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 0 3px var(--glow)'; }}
              onBlur={(e) => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none'; }}
            />
            {password && confirmPassword && password !== confirmPassword ? (
              <p className="mt-2 text-xs" style={{ color: 'var(--danger)' }}>Passwords do not match.</p>
            ) : null}
          </div>
          <motion.button
            type="submit"
            disabled={loading || !canSubmit}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-3 rounded-xl font-bold text-sm"
            style={{ background: 'var(--accent)', color: '#000', opacity: loading || !canSubmit ? 0.7 : 1 }}
          >
            {loading ? 'Updating…' : 'Update password'}
          </motion.button>
        </form>
      ) : (
        <div className="text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: 'var(--success)' + '22', border: '2px solid var(--success)' }}>
            <span className="text-2xl">✓</span>
          </div>
          <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
            Your password is ready to use. Sign in with the new password to continue.
          </p>
          <Link to="/login"
            className="inline-block px-6 py-2 rounded-xl text-sm font-semibold no-underline"
            style={{ background: 'var(--card-secondary)', border: '1px solid var(--border)', color: 'var(--text)' }}>
            Back to sign in
          </Link>
        </div>
      )}

      <p className="text-center text-sm mt-6" style={{ color: 'var(--text-muted)' }}>
        Need a fresh token? <Link to="/forgot-password" className="font-bold no-underline" style={{ color: 'var(--accent)' }}>Request another reset</Link>
      </p>
    </div>
  );
}