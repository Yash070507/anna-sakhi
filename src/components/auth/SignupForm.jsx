import React, { useState } from 'react';
import { Eye, EyeOff, Mail, Lock, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { GoogleButton } from './GoogleButton';
import { Button } from '../ui/Button';
import { clsx } from 'clsx';

function InputField({ label, id, type = 'text', value, onChange, placeholder, icon: Icon, error, autoComplete }) {
  const [show, setShow] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword && show ? 'text' : type;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-[var(--text-primary)]">
        {label}
      </label>
      <div className="relative">
        {Icon && (
          <Icon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
        )}
        <input
          id={id}
          type={inputType}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className={clsx(
            'w-full rounded-xl border px-4 py-3 text-sm bg-[var(--bg-input)]',
            'text-[var(--text-primary)] placeholder:text-[var(--text-muted)]',
            'focus:outline-none focus:ring-2 focus:ring-palm-500/50 focus:border-palm-500',
            'transition-all duration-200',
            Icon && 'pl-9',
            isPassword && 'pr-10',
            error ? 'border-red-400' : 'border-[var(--border-medium)]'
          )}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
            aria-label={show ? 'Hide password' : 'Show password'}
          >
            {show ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

export function SignupForm({ onSwitchToLogin }) {
  const { signupWithEmail, loginWithGoogle, loading, error, clearError } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const validate = () => {
    const errors = {};
    if (!name.trim()) errors.name = 'Full name is required';
    if (!email) errors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) errors.email = 'Enter a valid email';
    if (!password) errors.password = 'Password is required';
    else if (password.length < 6) errors.password = 'Min. 6 characters';
    if (!confirm) errors.confirm = 'Please confirm your password';
    else if (confirm !== password) errors.confirm = 'Passwords do not match';
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();
    const errors = validate();
    if (Object.keys(errors).length > 0) { setFieldErrors(errors); return; }
    setFieldErrors({});
    await signupWithEmail(name, email, password);
  };

  return (
    <div className="flex flex-col gap-5">
      <GoogleButton onClick={async () => { clearError(); await loginWithGoogle(); }} loading={loading} />

      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-[var(--border-subtle)]" />
        <span className="text-xs text-[var(--text-muted)] font-medium">or create with email</span>
        <div className="flex-1 h-px bg-[var(--border-subtle)]" />
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <InputField
          label="Full name" id="signup-name" type="text"
          value={name} onChange={(e) => { setName(e.target.value); setFieldErrors((p) => ({ ...p, name: '' })); }}
          placeholder="Priya Naik" icon={User} error={fieldErrors.name} autoComplete="name"
        />
        <InputField
          label="Email address" id="signup-email" type="email"
          value={email} onChange={(e) => { setEmail(e.target.value); setFieldErrors((p) => ({ ...p, email: '' })); }}
          placeholder="you@example.com" icon={Mail} error={fieldErrors.email} autoComplete="email"
        />
        <InputField
          label="Password" id="signup-password" type="password"
          value={password} onChange={(e) => { setPassword(e.target.value); setFieldErrors((p) => ({ ...p, password: '' })); }}
          placeholder="Min. 6 characters" icon={Lock} error={fieldErrors.password} autoComplete="new-password"
        />
        <InputField
          label="Confirm password" id="signup-confirm" type="password"
          value={confirm} onChange={(e) => { setConfirm(e.target.value); setFieldErrors((p) => ({ ...p, confirm: '' })); }}
          placeholder="Repeat your password" icon={Lock} error={fieldErrors.confirm} autoComplete="new-password"
        />

        {error && (
          <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        <Button type="submit" variant="green" size="lg" loading={loading} className="mt-1 w-full rounded-xl">
          Create account
        </Button>
      </form>

      <p className="text-center text-sm text-[var(--text-secondary)]">
        Already have an account?{' '}
        <button type="button" onClick={onSwitchToLogin} className="text-palm-600 dark:text-palm-400 font-semibold hover:underline">
          Sign in
        </button>
      </p>
    </div>
  );
}
