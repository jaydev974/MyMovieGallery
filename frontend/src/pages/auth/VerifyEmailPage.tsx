import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useToast } from '../../components/ui/useToast';
import { api } from '../../api/client';
import { useAuthStore } from '../../store/authStore';

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [token, setToken] = useState(searchParams.get('token') || '');
  const [requestedToken, setRequestedToken] = useState<string | null>(searchParams.get('token'));
  const [loadingRequest, setLoadingRequest] = useState(false);
  const [loadingConfirm, setLoadingConfirm] = useState(false);
  const [verified, setVerified] = useState(false);
  const toast = useToast();

  const canRequest = useMemo(() => email.trim().length > 0, [email]);
  const canConfirm = useMemo(() => token.trim().length >= 32, [token]);

  async function requestVerification(e: React.FormEvent) {
    e.preventDefault();
    if (!canRequest) return;
    setLoadingRequest(true);
    try {
      const response = await api.post<{ detail: string; token?: string | null }>('/api/auth/email-verification/request', {
        email,
      });
      setRequestedToken(response.token ?? null);
      if (response.token) setToken(response.token);
      toast.success('Verification instructions prepared', 'Check your email inbox or use the development token below.');
    } catch (error) {
      toast.error('Could not request verification', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setLoadingRequest(false);
    }
  }

  async function confirmVerification(e: React.FormEvent) {
    e.preventDefault();
    if (!canConfirm) return;
    setLoadingConfirm(true);
    try {
      await api.post('/api/auth/email-verification/confirm', { token: token.trim() });
      const currentUser = useAuthStore.getState().user;
      if (currentUser) {
        useAuthStore.setState({ user: { ...currentUser, isVerified: true } });
      }
      setVerified(true);
      toast.success('Email verified', 'Your account is now verified.');
    } catch (error) {
      toast.error('Could not verify email', error instanceof Error ? error.message : 'Please check the token and try again.');
    } finally {
      setLoadingConfirm(false);
    }
  }

  return (
    <div>
      <div className="text-center mb-8">
        <div className="text-4xl mb-4">✉️</div>
        <h1 className="text-2xl font-black mb-2" style={{ fontFamily: 'Poppins, sans-serif', color: 'var(--text)' }}>
          {verified ? 'Email verified' : 'Verify your email'}
        </h1>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          {verified
            ? 'Your account has been verified successfully.'
            : 'Request a verification link, then paste the token here to confirm your email address.'}
        </p>
      </div>

      {!verified ? (
        <div className="space-y-6">
          <form onSubmit={requestVerification} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                style={{ background: 'var(--card-secondary)', border: '1px solid var(--border)', color: 'var(--text)' }}
                onFocus={(e) => { e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 0 3px var(--glow)'; }}
                onBlur={(e) => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none'; }}
              />
            </div>
            <motion.button
              type="submit"
              disabled={loadingRequest || !canRequest}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3 rounded-xl font-bold text-sm"
              style={{ background: 'var(--accent)', color: '#000', opacity: loadingRequest || !canRequest ? 0.7 : 1 }}
            >
              {loadingRequest ? 'Sending…' : 'Send verification link'}
            </motion.button>
          </form>

          <form onSubmit={confirmVerification} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>Verification token</label>
              <input
                type="text"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Paste verification token"
                required
                className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                style={{ background: 'var(--card-secondary)', border: '1px solid var(--border)', color: 'var(--text)' }}
                onFocus={(e) => { e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 0 3px var(--glow)'; }}
                onBlur={(e) => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none'; }}
              />
            </div>
            <motion.button
              type="submit"
              disabled={loadingConfirm || !canConfirm}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3 rounded-xl font-bold text-sm"
              style={{ background: 'var(--accent)', color: '#000', opacity: loadingConfirm || !canConfirm ? 0.7 : 1 }}
            >
              {loadingConfirm ? 'Verifying…' : 'Verify email'}
            </motion.button>
          </form>

          {requestedToken ? (
            <div className="rounded-2xl border px-4 py-3 text-left text-xs font-mono leading-5" style={{ background: 'var(--card-secondary)', borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em]" style={{ color: 'var(--text-secondary)' }}>Development verification token</p>
              <p className="break-all">{requestedToken}</p>
              <p className="mt-3 text-[11px] leading-5" style={{ color: 'var(--text-secondary)' }}>
                Use the token above in the verification form.
              </p>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'var(--success)' + '22', border: '2px solid var(--success)' }}>
            <span className="text-2xl">✓</span>
          </div>
          <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
            You can return to your profile settings or continue exploring MyMovieGallery.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link to="/settings" className="inline-block px-6 py-2 rounded-xl text-sm font-semibold no-underline" style={{ background: 'var(--card-secondary)', border: '1px solid var(--border)', color: 'var(--text)' }}>
              Go to settings
            </Link>
            <Link to="/dashboard" className="inline-block px-6 py-2 rounded-xl text-sm font-semibold no-underline" style={{ background: 'var(--accent)', color: '#000' }}>
              Open dashboard
            </Link>
          </div>
        </div>
      )}

      <p className="text-center text-sm mt-6" style={{ color: 'var(--text-muted)' }}>
        Need a different action? <Link to="/login" className="font-bold no-underline" style={{ color: 'var(--accent)' }}>Back to sign in</Link>
      </p>
    </div>
  );
}
