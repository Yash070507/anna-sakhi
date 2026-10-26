import React from 'react';
import { clsx } from 'clsx';

/**
 * Avatar component — shows photo or initials fallback
 * size: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
 */
export function Avatar({ src, initials = '?', size = 'md', className = '', alt = '' }) {
  const sizes = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-9 h-9 text-sm',
    lg: 'w-11 h-11 text-base',
    xl: 'w-14 h-14 text-lg',
  };

  if (src) {
    return (
      <img
        src={src}
        alt={alt}
        className={clsx(
          'rounded-full object-cover ring-2 ring-[var(--border-subtle)]',
          sizes[size],
          className
        )}
      />
    );
  }

  return (
    <div
      className={clsx(
        'rounded-full flex items-center justify-center font-semibold select-none',
        'bg-gradient-to-br from-palm-500 to-palm-700 text-white',
        sizes[size],
        className
      )}
      aria-label={alt || initials}
    >
      {initials}
    </div>
  );
}

/**
 * Anna Sakhi Assistant Avatar — coconut palm icon style
 */
export function AssistantAvatar({ size = 'md', className = '' }) {
  const sizes = {
    sm: 'w-7 h-7 text-base',
    md: 'w-8 h-8 text-lg',
    lg: 'w-10 h-10 text-xl',
  };

  return (
    <div
      className={clsx(
        'rounded-full flex items-center justify-center flex-shrink-0',
        'bg-gradient-to-br from-palm-600 to-sea-600',
        sizes[size],
        className
      )}
    >
      <span role="img" aria-label="Anna Sakhi">🌴</span>
    </div>
  );
}
