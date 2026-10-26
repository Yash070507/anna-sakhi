import React, { useState, useRef, useEffect, useCallback } from 'react';
import { LogOut, Sparkles, User, ChevronDown, X, Plus, Trash2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Avatar } from '../ui/Avatar';
import { ThemeToggle } from '../ui/ThemeToggle';
import { motion, AnimatePresence } from 'framer-motion';
import { getStoredMemory, saveStoredMemory } from '../../services/memoryService';

function MemoryModal({ isOpen, onClose, user }) {
  const [memoryList, setMemoryList] = useState([]);
  const [newItem, setNewItem]       = useState('');

  useEffect(() => {
    if (isOpen) {
      setMemoryList(getStoredMemory(user));
    }
  }, [isOpen, user]);

  const handleAdd = useCallback((e) => {
    e?.preventDefault();
    const clean = newItem.trim();
    if (!clean) return;
    const formatted = clean.toLowerCase().startsWith('go-to') || clean.toLowerCase().startsWith('diet:')
      ? clean
      : `Go-to food: ${clean}`;
    if (!memoryList.includes(formatted)) {
      const next = [...memoryList, formatted];
      setMemoryList(next);
      saveStoredMemory(user, next);
    }
    setNewItem('');
  }, [newItem, memoryList, user]);

  const handleRemove = useCallback((itemToRemove) => {
    const next = memoryList.filter((m) => m !== itemToRemove);
    setMemoryList(next);
    saveStoredMemory(user, next);
  }, [memoryList, user]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-2xl shadow-lifted p-5 overflow-hidden"
      >
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-palm-100 dark:bg-palm-900/40 text-palm-700 dark:text-palm-300 flex items-center justify-center">
              <Sparkles size={16} />
            </div>
            <div>
              <h3 className="text-base font-semibold text-[var(--text-primary)]">My Tastes & Memory</h3>
              <p className="text-xs text-[var(--text-muted)]">Foods Anna Sakhi remembers across chats</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:bg-[var(--border-subtle)] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* List of remembered items */}
        <div className="py-4 space-y-2 max-h-60 overflow-y-auto">
          {memoryList.length === 0 ? (
            <div className="text-center py-6 text-sm text-[var(--text-muted)]">
              No remembered foods yet.<br />
              Tell Anna Sakhi in chat (e.g. <em>&quot;My go-to food is sol kadhi&quot;</em>) or add one below!
            </div>
          ) : (
            memoryList.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between px-3 py-2 rounded-xl bg-palm-50/60 dark:bg-palm-950/30 border border-palm-200/50 dark:border-palm-800/40 text-sm text-[var(--text-primary)]"
              >
                <span>{item}</span>
                <button
                  type="button"
                  onClick={() => handleRemove(item)}
                  className="p-1 text-[var(--text-muted)] hover:text-red-500 rounded transition-colors"
                  title="Remove"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Add new memory */}
        <form onSubmit={handleAdd} className="flex gap-2 pt-3 border-t border-[var(--border-subtle)]">
          <input
            type="text"
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            placeholder="Add go-to food (e.g. Sol Kadhi, Poha)..."
            className="flex-1 px-3 py-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-input)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-palm-500"
          />
          <button
            type="submit"
            disabled={!newItem.trim()}
            className="px-3.5 py-2 rounded-xl bg-palm-600 hover:bg-palm-700 disabled:opacity-50 text-white text-sm font-medium flex items-center gap-1 transition-colors"
          >
            <Plus size={16} />
            Add
          </button>
        </form>
      </motion.div>
    </div>
  );
}

export function UserMenu() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [showMemory, setShowMemory] = useState(false);
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

  return (
    <>
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
                <button
                  type="button"
                  onClick={() => { setShowMemory(true); setOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--text-primary)] hover:bg-[var(--border-subtle)] transition-colors"
                >
                  <Sparkles size={15} className="text-palm-600 dark:text-palm-400" />
                  My Tastes & Memory
                </button>

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

      <MemoryModal
        isOpen={showMemory}
        onClose={() => setShowMemory(false)}
        user={user}
      />
    </>
  );
}
