import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { EyeIcon, EyeSlashIcon, CheckIcon } from '@heroicons/react/24/outline';
import { useAuthStore } from '../../store/authStore';
import { useToast } from '../../components/ui/useToast';

const PASSWORD_RULES = [
  { label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
  { label: 'One uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
  { label: 'One number', test: (p: string) => /\d/.test(p) },
];

function isPasswordStrongEnough(password: string): boolean {
  return PASSWORD_RULES.every((rule) => rule.test(password));
}

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [isPrivate, setIsPrivate] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { register, isLoading } = useAuthStore();
  const toast = useToast();
  const navigate = useNavigate();

  function validate() {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'Name is required';
    if (!email) errs.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) errs.email = 'Invalid email';
    if (!password) errs.password = 'Password is required';
    else if (!isPasswordStrongEnough(password)) errs.password = 'Use 8+ characters with one uppercase letter and one number';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    try {
      await register(name, email, password, isPrivate);
      toast.success('Account created!', 'Welcome to MyMovieGallery 🎬');
      navigate('/dashboard');
    } catch {
      toast.error('Registration failed', 'Please try again');
    }
  }

  const inputStyle = (err?: string) => ({
    background: 'var(--card-secondary)',
    border: `1px solid ${err ? 'var(--danger)' : 'var(--border)'}`,
    color: 'var(--text)',
  });

  const focusStyle = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = 'var(--accent)';
    e.target.style.boxShadow = '0 0 0 3px var(--glow)';
  };
  const blurStyle = (err?: string) => (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = err ? 'var(--danger)' : 'var(--border)';
    e.target.style.boxShadow = 'none';
  };

  return (
    <div>
      <div className="text-center mb-8">
        <h1 className="text-2xl font-black mb-2" style={{ fontFamily: 'Poppins, sans-serif', color: 'var(--text)' }}>
          Create Account
        </h1>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Join the cinema community</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>Full Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Alex Cinema"
            className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
            style={inputStyle(errors.name)}
            onFocus={focusStyle}
            onBlur={blurStyle(errors.name)}
          />
          {errors.name && <p className="text-xs mt-1" style={{ color: 'var(--danger)' }}>{errors.name}</p>}
        </div>

        <label className="flex items-center gap-3 rounded-xl p-3 cursor-pointer" style={{ background: 'var(--card-secondary)', border: '1px solid var(--border)' }}>
          <input type="checkbox" checked={isPrivate} onChange={(e) => setIsPrivate(e.target.checked)} />
          <span className="text-sm" style={{ color: 'var(--text)' }}>Make my account private</span>
        </label>

        <div>
          <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
            style={inputStyle(errors.email)}
            onFocus={focusStyle}
            onBlur={blurStyle(errors.email)}
          />
          {errors.email && <p className="text-xs mt-1" style={{ color: 'var(--danger)' }}>{errors.email}</p>}
        </div>

        <div>
          <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>Password</label>
          <div className="relative">
            <input
              type={showPw ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 pr-12 rounded-xl text-sm outline-none transition-all"
              style={inputStyle(errors.password)}
              onFocus={focusStyle}
              onBlur={blurStyle(errors.password)}
            />
            <button
              type="button"
              onClick={() => setShowPw((p) => !p)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1"
              style={{ color: 'var(--text-muted)', background: 'none', border: 'none' }}
            >
              {showPw ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
            </button>
          </div>
          {password && (
            <div className="mt-2 space-y-1">
              {PASSWORD_RULES.map((rule) => {
                const ok = rule.test(password);
                return (
                  <div key={rule.label} className="flex items-center gap-2">
                    <CheckIcon className="w-3.5 h-3.5" style={{ color: ok ? 'var(--success)' : 'var(--text-muted)' }} />
                    <span className="text-xs" style={{ color: ok ? 'var(--success)' : 'var(--text-muted)' }}>{rule.label}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <motion.button
          type="submit"
          disabled={isLoading}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full py-3 rounded-xl font-bold text-sm mt-2"
          style={{ background: 'var(--accent)', color: '#000', opacity: isLoading ? 0.7 : 1, boxShadow: '0 0 20px var(--glow)' }}
        >
          {isLoading ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              Creating account…
            </div>
          ) : 'Create Account'}
        </motion.button>
      </form>

      <p className="text-center text-sm mt-6" style={{ color: 'var(--text-muted)' }}>
        Already have an account?{' '}
        <Link to="/login" className="font-bold no-underline" style={{ color: 'var(--accent)' }}>Sign in</Link>
      </p>
    </div>
  );
}
