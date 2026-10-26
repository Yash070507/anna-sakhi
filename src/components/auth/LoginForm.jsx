import React, { useState } from 'react';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { GoogleButton } from './GoogleButton';
import { Button } from '../ui/Button';
import { clsx } from 'clsx';

function InputField({ label, id, type = 'text', value, onChange, placeholder, icon: Icon, error }) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword && showPassword ? 'text' : type;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-[var(--text-primary)]">
        {label}
      </label>
      <div className="relative">
        {Icon && (
          <Icon
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none"
          />
        )}
        <input
          id={id}
          type={inputType}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={clsx(
            'w-full rounded-xl border px-4 py-3 text-sm bg-[var(--bg-input)]',
            'text-[var(--text-primary)] placeholder:text-[var(--text-muted)]',
            'focus:outline-none focus:ring-2 focus:ring-palm-500/50 focus:border-palm-500',
            'transition-all duration-200',
            Icon && 'pl-9',
            isPassword && 'pr-10',
            error ? 'border-red-400' : 'border-[var(--border-medium)]'
          )}
          autoComplete={isPassword ? 'current-password' : type === 'email' ? 'email' : 'off'}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

export function LoginForm({ onSwitchToSignup, onSwitchToForgot }) {
  const { loginWithEmail, loginWithGoogle, loading, error, clearError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const validate = () => {
    const errors = {};
    if (!email) errors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) errors.email = 'Enter a valid email';
    if (!password) errors.password = 'Password is required';
    else if (password.length < 6) errors.password = 'Min. 6 characters';
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();
    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    await loginWithEmail(email, password);
  };

  const handleGoogle = async () => {
    clearError();
    await loginWithGoogle();
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Google — primary CTA */}
      <GoogleButton onClick={handleGoogle} loading={loading} />

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-[var(--border-subtle)]" />
        <span className="text-xs text-[var(--text-muted)] font-medium">or continue with email</span>
        <div className="flex-1 h-px bg-[var(--border-subtle)]" />
      </div>

      {/* Email / Password form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <InputField
          label="Email address"
          id="login-email"
          type="email"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setFieldErrors((p) => ({ ...p, email: '' })); }}
          placeholder="you@example.com"
          icon={Mail}
          error={fieldErrors.email}
        />
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="login-password" className="text-sm font-medium text-[var(--text-primary)]">
              Password
            </label>
            <button
              type="button"
              onClick={onSwitchToForgot}
              className="text-xs text-palm-600 dark:text-palm-400 hover:underline font-medium"
            >
              Forgot password?
            </button>
          </div>
          <div className="relative">
            <Lock
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none"
            />
            <PasswordInput
              id="login-password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setFieldErrors((p) => ({ ...p, password: '' })); }}
              error={fieldErrors.password}
            />
          </div>
          {fieldErrors.password && <p className="text-xs text-red-500">{fieldErrors.password}</p>}
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        <Button type="submit" variant="green" size="lg" loading={loading} className="mt-1 w-full rounded-xl">
          Sign in
        </Button>
      </form>

      {/* Switch to Signup */}
      <p className="text-center text-sm text-[var(--text-secondary)]">
        Don't have an account?{' '}
        <button
          type="button"
          onClick={onSwitchToSignup}
          className="text-palm-600 dark:text-palm-400 font-semibold hover:underline"
        >
          Create one
        </button>
      </p>
    </div>
  );
}

// Inline password input (avoids double-rendering the outer InputField for the forgot link layout)
function PasswordInput({ id, value, onChange, error }) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <input
        id={id}
        type={show ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        placeholder="••••••••"
        autoComplete="current-password"
        className={clsx(
          'w-full rounded-xl border px-4 py-3 pl-9 pr-10 text-sm bg-[var(--bg-input)]',
          'text-[var(--text-primary)] placeholder:text-[var(--text-muted)]',
          'focus:outline-none focus:ring-2 focus:ring-palm-500/50 focus:border-palm-500',
          'transition-all duration-200',
          error ? 'border-red-400' : 'border-[var(--border-medium)]'
        )}
      />
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
        aria-label={show ? 'Hide password' : 'Show password'}
      >
        {show ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
}
