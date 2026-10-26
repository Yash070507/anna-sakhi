import React, { useState, useRef, useEffect } from 'react';
import { LogOut, Settings, User, ChevronDown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Avatar } from '../ui/Avatar';
import { ThemeToggle } from '../ui/ThemeToggle';
import { motion, AnimatePresence } from 'framer-motion';

export function UserMenu() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (!user) return null;

  const menuItems = [
    { icon: User, label: 'Profile', onClick: () => {} },
    { icon: Settings, label: 'Settings', onClick: () => {} },
  ];

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[var(--border-subtle)] transition-all duration-150 group"
        aria-label="User menu"
        aria-expanded={open}
      >
        <Avatar
          src={user.photoURL}
          initials={user.initials}
          size="sm"
          alt={user.displayName}
        />
        <div className="flex-1 min-w-0 text-left">
          <p className="text-sm font-medium text-[var(--text-primary)] truncate leading-tight">
            {user.displayName}
          </p>
          <p className="text-xs text-[var(--text-muted)] truncate leading-tight">
            {user.email}
          </p>
        </div>
        <ChevronDown
          size={15}
          className={`text-[var(--text-muted)] transition-transform duration-200 flex-shrink-0 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full left-0 right-0 mb-2 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl shadow-lifted z-50 overflow-hidden"
          >
            {/* User info header */}
            <div className="px-4 py-3 border-b border-[var(--border-subtle)]">
              <p className="text-sm font-semibold text-[var(--text-primary)]">{user.displayName}</p>
              <p className="text-xs text-[var(--text-muted)]">{user.email}</p>
            </div>

            {/* Menu items */}
            <div className="py-1">
              {menuItems.map(({ icon: Icon, label, onClick }) => (
                <button
                  key={label}
                  onClick={() => { onClick(); setOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--text-primary)] hover:bg-[var(--border-subtle)] transition-colors"
                >
                  <Icon size={15} className="text-[var(--text-muted)]" />
                  {label}
                </button>
              ))}

              {/* Theme toggle inline */}
              <div className="flex items-center gap-3 px-4 py-2.5">
                <span className="text-sm text-[var(--text-primary)]">Theme</span>
                <ThemeToggle showLabel className="ml-auto" />
              </div>
            </div>

            <div className="border-t border-[var(--border-subtle)] py-1">
              <button
                onClick={() => { logout(); setOpen(false); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <LogOut size={15} />
                Sign out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
