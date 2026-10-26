import React from 'react';
import { clsx } from 'clsx';

/**
 * Reusable Button component
 * variant: 'green' | 'ghost' | 'outline' | 'terra' | 'danger'
 * size: 'sm' | 'md' | 'lg'
 */
export function Button({
  children,
  variant = 'green',
  size = 'md',
  className = '',
  disabled = false,
  loading = false,
  onClick,
  type = 'button',
  ...props
}) {
  const base =
    'inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 select-none';

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  const variants = {
    green:
      'btn-green focus-visible:ring-palm-500',
    ghost:
      'btn-ghost focus-visible:ring-palm-400 rounded-lg',
    outline:
      'border border-[var(--border-medium)] text-[var(--text-primary)] hover:bg-[var(--border-subtle)] focus-visible:ring-palm-400',
    terra:
      'bg-terracotta-500 text-white hover:bg-terracotta-600 shadow-sm hover:shadow-md focus-visible:ring-terracotta-400 active:scale-95',
    danger:
      'bg-red-500 text-white hover:bg-red-600 focus-visible:ring-red-400',
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={clsx(
        base,
        sizes[size],
        variants[variant],
        (disabled || loading) && 'opacity-50 cursor-not-allowed pointer-events-none',
        className
      )}
      {...props}
    >
      {loading ? (
        <svg
          className="animate-spin h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12" cy="12" r="10"
            stroke="currentColor" strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      ) : null}
      {children}
    </button>
  );
}
