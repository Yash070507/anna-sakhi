import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

/**
 * Mobile sidebar drawer with overlay backdrop
 */
export function Drawer({ isOpen, onClose, children }) {
  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
            aria-hidden="true"
          />

          {/* Drawer panel */}
          <motion.div
            key="drawer"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed inset-y-0 left-0 z-50 w-[280px] bg-sidebar shadow-lifted md:hidden flex flex-col"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation sidebar"
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-3 p-1.5 rounded-lg btn-ghost text-[var(--text-muted)]"
              aria-label="Close sidebar"
            >
              <X size={18} />
            </button>

            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
