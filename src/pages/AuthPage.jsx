import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { LoginForm } from '../components/auth/LoginForm';
import { SignupForm } from '../components/auth/SignupForm';
import { ForgotPasswordForm } from '../components/auth/ForgotPasswordForm';
import { ThemeToggle } from '../components/ui/ThemeToggle';

const VIEWS = {
  LOGIN: 'login',
  SIGNUP: 'signup',
  FORGOT: 'forgot',
};

const VIEW_TITLES = {
  login: { title: 'Welcome back', subtitle: 'Sign in to your Anna Sakhi kitchen' },
  signup: { title: 'Join Anna Sakhi', subtitle: 'Your personal Konkan kitchen companion' },
  forgot: { title: 'Reset password', subtitle: 'We\'ll help you get back in' },
};

export default function AuthPage() {
  const [view, setView] = useState(VIEWS.LOGIN);

  const { title, subtitle } = VIEW_TITLES[view];

  return (
    <div className="auth-bg konkan-pattern min-h-screen flex flex-col items-center justify-center px-4 py-10">
      {/* Theme toggle — top right */}
      <div className="fixed top-4 right-4 z-10">
        <ThemeToggle />
      </div>

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-md"
      >
        {/* Branding */}
        <div className="text-center mb-8">
          {/* Logo mark */}
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-palm-600 to-sea-600 shadow-lifted mb-4">
            <span className="text-3xl" role="img" aria-label="Anna Sakhi">🌴</span>
          </div>
          <h1 className="font-display text-3xl font-semibold text-[var(--text-primary)] tracking-tight">
            Anna Sakhi
          </h1>
          <p className="text-sm text-[var(--text-muted)] mt-1 font-medium tracking-wide uppercase">
            Your Kitchen Companion
          </p>
        </div>

        {/* Auth card */}
        <div className="bg-[var(--bg-elevated)] rounded-2xl shadow-card border border-[var(--border-subtle)] overflow-hidden">
          {/* Header */}
          <div className="px-8 pt-8 pb-6 border-b border-[var(--border-subtle)]">
            <AnimatePresence mode="wait">
              <motion.div
                key={view + '-header'}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <h2 className="font-display text-2xl font-semibold text-[var(--text-primary)]">
                  {title}
                </h2>
                <p className="text-sm text-[var(--text-secondary)] mt-1">{subtitle}</p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Form area */}
          <div className="px-8 py-7">
            <AnimatePresence mode="wait">
              <motion.div
                key={view}
                initial={{ opacity: 0, x: view === VIEWS.LOGIN ? -12 : 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: view === VIEWS.LOGIN ? 12 : -12 }}
                transition={{ duration: 0.25 }}
              >
                {view === VIEWS.LOGIN && (
                  <LoginForm
                    onSwitchToSignup={() => setView(VIEWS.SIGNUP)}
                    onSwitchToForgot={() => setView(VIEWS.FORGOT)}
                  />
                )}
                {view === VIEWS.SIGNUP && (
                  <SignupForm onSwitchToLogin={() => setView(VIEWS.LOGIN)} />
                )}
                {view === VIEWS.FORGOT && (
                  <ForgotPasswordForm onBack={() => setView(VIEWS.LOGIN)} />
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-[var(--text-muted)] mt-6">
          By continuing, you agree to our{' '}
          <span className="underline cursor-pointer hover:text-[var(--text-secondary)]">Terms</span>{' '}
          and{' '}
          <span className="underline cursor-pointer hover:text-[var(--text-secondary)]">Privacy Policy</span>
        </p>
      </motion.div>
    </div>
  );
}
