import React, { useState } from 'react';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';
import { clsx } from 'clsx';

export function ForgotPasswordForm({ onBack }) {
  const { sendPasswordReset, loading, error, clearError } = useAuth();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [fieldError, setFieldError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();
    if (!email) { setFieldError('Email is required'); return; }
    if (!/\S+@\S+\.\S+/.test(email)) { setFieldError('Enter a valid email address'); return; }
    setFieldError('');
    const result = await sendPasswordReset(email);
    if (result.success) setSent(true);
  };

  if (sent) {
    return (
      <div className="flex flex-col items-center gap-5 text-center py-4">
        <div className="w-14 h-14 rounded-full bg-[var(--accent-green-light)] flex items-center justify-center">
          <CheckCircle size={28} className="text-palm-600 dark:text-palm-400" />
        </div>
        <div>
          <h3 className="font-display text-xl font-semibold text-[var(--text-primary)] mb-1">
            Check your inbox
          </h3>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
            We've sent a password reset link to{' '}
            <strong className="text-[var(--text-primary)]">{email}</strong>.
            Check your spam folder if you don't see it.
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          onClick={onBack}
          className="flex items-center gap-2"
        >
          <ArrowLeft size={16} />
          Back to sign in
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="text-center">
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
          Enter your email address and we'll send you a link to reset your password.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="reset-email" className="text-sm font-medium text-[var(--text-primary)]">
            Email address
          </label>
          <div className="relative">
            <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
            <input
              id="reset-email"
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setFieldError(''); }}
              placeholder="you@example.com"
              autoComplete="email"
              className={clsx(
                'w-full rounded-xl border px-4 py-3 pl-9 text-sm bg-[var(--bg-input)]',
                'text-[var(--text-primary)] placeholder:text-[var(--text-muted)]',
                'focus:outline-none focus:ring-2 focus:ring-palm-500/50 focus:border-palm-500',
                'transition-all duration-200',
                fieldError ? 'border-red-400' : 'border-[var(--border-medium)]'
              )}
            />
          </div>
          {fieldError && <p className="text-xs text-red-500">{fieldError}</p>}
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        <Button type="submit" variant="green" size="lg" loading={loading} className="w-full rounded-xl">
          Send reset link
        </Button>
      </form>

      <button
        type="button"
        onClick={onBack}
        className="flex items-center justify-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors mx-auto"
      >
        <ArrowLeft size={15} />
        Back to sign in
      </button>
    </div>
  );
}
