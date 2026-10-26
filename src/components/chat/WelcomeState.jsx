import React from 'react';
import { motion } from 'framer-motion';
import { SUGGESTED_PROMPTS } from '../../data/mockMessages';

export function WelcomeState({ onPromptSelect }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="flex flex-col items-center justify-center h-full px-6 py-12 text-center max-w-2xl mx-auto"
    >
      {/* Logo */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="w-20 h-20 rounded-3xl bg-gradient-to-br from-palm-600 to-sea-600 flex items-center justify-center shadow-lifted mb-6"
      >
        <span className="text-4xl" role="img" aria-label="Anna Sakhi">🌴</span>
      </motion.div>

      {/* Heading */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <h2 className="font-display text-3xl md:text-4xl font-semibold text-[var(--text-primary)] mb-2 tracking-tight">
          Namaskāra! I'm Anna Sakhi
        </h2>
        <p className="text-[var(--text-secondary)] text-base md:text-lg leading-relaxed max-w-lg mx-auto">
          Your personal Konkan kitchen companion. Ask me anything about recipes,
          ingredients, nutrition, or cooking technique.
        </p>
      </motion.div>

      {/* Decorative dots — coastal wave motif */}
      <div className="flex gap-1.5 my-6">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="w-1.5 h-1.5 rounded-full"
            style={{
              backgroundColor: i % 2 === 0
                ? 'var(--accent-green)'
                : i === 2
                ? 'var(--accent-terra)'
                : 'var(--accent-sea)',
              opacity: 0.5 + i * 0.08,
            }}
          />
        ))}
      </div>

      {/* Suggested prompts */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.35 }}
        className="w-full"
      >
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--text-muted)] mb-4">
          Try asking
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {SUGGESTED_PROMPTS.map((prompt, idx) => (
            <motion.button
              key={prompt.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.4 + idx * 0.07 }}
              onClick={() => onPromptSelect(prompt.query)}
              className="flex items-center gap-3 px-4 py-3.5 rounded-2xl border border-[var(--border-medium)] bg-[var(--bg-elevated)] text-left
                         hover:border-palm-400 hover:bg-[var(--accent-green-light)] hover:shadow-soft
                         transition-all duration-200 group"
            >
              <span className="text-xl flex-shrink-0 group-hover:scale-110 transition-transform">
                {prompt.icon}
              </span>
              <span className="text-sm font-medium text-[var(--text-primary)] leading-snug">
                {prompt.label}
              </span>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Subtle tagline */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="mt-8 text-xs text-[var(--text-muted)] font-medium"
      >
        Inspired by the flavours of the Konkan coast 🌊
      </motion.p>
    </motion.div>
  );
}
