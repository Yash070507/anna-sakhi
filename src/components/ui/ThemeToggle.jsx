import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { clsx } from 'clsx';

export function ThemeToggle({ className = '', showLabel = false }) {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={clsx(
        'flex items-center gap-2 px-2.5 py-2 rounded-lg btn-ghost text-[var(--text-secondary)]',
        'transition-all duration-200',
        className
      )}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Light mode' : 'Dark mode'}
    >
      {isDark ? (
        <Sun size={16} className="text-terracotta-400" />
      ) : (
        <Moon size={16} className="text-sea-500" />
      )}
      {showLabel && (
        <span className="text-xs font-medium">
          {isDark ? 'Light mode' : 'Dark mode'}
        </span>
      )}
    </button>
  );
}
