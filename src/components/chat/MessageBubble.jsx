import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { X, Copy, Check } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { AssistantAvatar } from '../ui/Avatar';
import { RecipeCard } from '../recipe/RecipeCard';

// ─── Lightbox ─────────────────────────────────────────────
function Lightbox({ src, alt, onClose }) {
  // Close on Escape key
  React.useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.85, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          className="relative max-w-4xl max-h-[90vh] w-full flex items-center justify-center"
          onClick={(e) => e.stopPropagation()}
        >
          <img
            src={src}
            alt={alt}
            className="max-w-full max-h-[85vh] rounded-2xl shadow-2xl object-contain"
          />
          <button
            type="button"
            onClick={onClose}
            className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 text-white flex items-center justify-center hover:bg-white/30 transition-colors"
            aria-label="Close image"
          >
            <X size={15} strokeWidth={2.5} />
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ─── Image Grid ───────────────────────────────────────────
function AttachmentGrid({ attachments }) {
  const [lightbox, setLightbox] = useState(null); // { src, alt }

  if (!attachments || attachments.length === 0) return null;

  const gridCols =
    attachments.length === 1 ? 'grid-cols-1' :
    attachments.length === 2 ? 'grid-cols-2' :
    'grid-cols-3';

  return (
    <>
      <div className={clsx('grid gap-1.5 mb-2', gridCols)}>
        {attachments.map((att) => (
          <motion.button
            key={att.id}
            type="button"
            onClick={() => setLightbox({ src: att.dataUrl, alt: att.name })}
            className="block rounded-xl overflow-hidden border border-white/20 shadow-soft hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-white/50"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            aria-label={`View image: ${att.name}`}
          >
            <img
              src={att.dataUrl}
              alt={att.name}
              className={clsx(
                'w-full object-cover',
                attachments.length === 1 ? 'max-h-64' : 'h-28 md:h-36'
              )}
            />
          </motion.button>
        ))}
      </div>

      {lightbox && (
        <Lightbox
          src={lightbox.src}
          alt={lightbox.alt}
          onClose={() => setLightbox(null)}
        />
      )}
    </>
  );
}

// ─── User Bubble ──────────────────────────────────────────
function UserBubble({ message }) {
  const hasAttachments = message.attachments && message.attachments.length > 0;
  const hasText = message.content && message.content.trim().length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, x: 8 }}
      animate={{ opacity: 1, y: 0, x: 0 }}
      transition={{ duration: 0.3 }}
      className="flex justify-end mb-4"
    >
      <div className="max-w-[80%] md:max-w-[65%]">
        <div className="bg-gradient-to-br from-palm-600 to-palm-700 text-white px-4 py-3 rounded-2xl rounded-br-sm shadow-soft">
          {hasAttachments && <AttachmentGrid attachments={message.attachments} />}
          {hasText && (
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
          )}
        </div>
        <p className="text-right text-[10px] text-[var(--text-muted)] mt-1 px-1">
          {formatTime(message.timestamp)}
        </p>
      </div>
    </motion.div>
  );
}

// ─── Markdown Renderer ────────────────────────────────────
function MarkdownContent({ content }) {
  if (!content) return null;

  return (
    <ReactMarkdown
      components={{
        h1: ({ children }) => (
          <h1 className="text-lg font-bold text-earth-900 dark:text-earth-100 mt-3 mb-2">
            {children}
          </h1>
        ),
        h2: ({ children }) => (
          <h2 className="text-base font-bold text-earth-900 dark:text-earth-100 mt-4 mb-2">
            {children}
          </h2>
        ),
        h3: ({ children }) => (
          <h3 className="text-xs font-bold uppercase tracking-wider text-palm-800 dark:text-palm-300 mt-5 mb-2.5 pb-1 border-b border-palm-200/60 dark:border-palm-800/50">
            {children}
          </h3>
        ),
        p: ({ children }) => {
          const text = Array.isArray(children)
            ? children.map((c) => (typeof c === 'string' ? c : '')).join('')
            : typeof children === 'string'
            ? children
            : '';

          // Check for recipe metadata line: "Serves X | Prep Y mins | Cook Z mins"
          if (text.includes('Serves') && text.includes('|')) {
            return (
              <div className="inline-flex flex-wrap items-center gap-2 px-3 py-1.5 my-2.5 bg-palm-50 dark:bg-palm-950/40 text-palm-800 dark:text-palm-300 rounded-lg text-xs font-medium border border-palm-200/60 dark:border-palm-800/40 shadow-xs">
                {children}
              </div>
            );
          }
          return <p className="text-sm leading-relaxed my-2 text-[var(--text-primary)]">{children}</p>;
        },
        ul: ({ children }) => (
          <ul className="space-y-1.5 my-2 pl-4 list-disc marker:text-palm-600 dark:marker:text-palm-400">
            {children}
          </ul>
        ),
        ol: ({ children }) => (
          <ol className="space-y-3.5 my-3 pl-4 list-decimal marker:font-bold marker:text-palm-700 dark:marker:text-palm-300">
            {children}
          </ol>
        ),
        li: ({ children }) => (
          <li className="text-sm leading-relaxed text-[var(--text-primary)] pl-0.5">
            {children}
          </li>
        ),
        strong: ({ children }) => (
          <strong className="font-semibold text-earth-900 dark:text-earth-100">
            {children}
          </strong>
        ),
        blockquote: ({ children }) => (
          <blockquote className="border-l-2 border-palm-400 pl-3 my-2 text-sm italic text-[var(--text-muted)]">
            {children}
          </blockquote>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

// ─── Assistant Bubble ─────────────────────────────────────
function AssistantBubble({ message }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    if (!message.content) return;
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [message.content]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, x: -8 }}
      animate={{ opacity: 1, y: 0, x: 0 }}
      transition={{ duration: 0.3 }}
      className="flex gap-3 mb-4 group"
    >
      <AssistantAvatar size="md" className="flex-shrink-0 mt-0.5" />

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1.5 pr-2">
          <p className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
            Anna Sakhi
          </p>
          {message.content && (
            <button
              type="button"
              onClick={handleCopy}
              className="opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity text-xs text-[var(--text-muted)] hover:text-palm-600 dark:hover:text-palm-400 flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-black/5 dark:hover:bg-white/5"
              title="Copy recipe"
              aria-label="Copy recipe text"
            >
              {copied ? (
                <>
                  <Check size={12} className="text-palm-600 dark:text-palm-400" />
                  <span className="text-[10px] text-palm-600 dark:text-palm-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy size={12} />
                  <span className="text-[10px]">Copy</span>
                </>
              )}
            </button>
          )}
        </div>

        {message.type === 'recipe' ? (
          <RecipeCard recipe={message.recipe} />
        ) : (
          <div className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-2xl rounded-tl-sm px-5 py-4 shadow-soft max-w-[95%] md:max-w-[85%] lg:max-w-[80%]">
            <div className="message-prose text-sm text-[var(--text-primary)]">
              <MarkdownContent content={message.content} />
            </div>
          </div>
        )}

        <p className="text-[10px] text-[var(--text-muted)] mt-1 px-1">
          {formatTime(message.timestamp)}
        </p>
      </div>
    </motion.div>
  );
}

// ─── Typing Indicator ─────────────────────────────────────
function TypingIndicator() {
  return (
    <div className="flex gap-3 mb-4">
      <AssistantAvatar size="md" className="flex-shrink-0 mt-0.5" />
      <div className="flex flex-col gap-1">
        <p className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
          Anna Sakhi
        </p>
        <div className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-2xl rounded-tl-sm px-4 py-3 shadow-soft inline-flex items-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="typing-dot w-2 h-2 rounded-full bg-palm-500 animate-typing"
              style={{ animationDelay: `${i * 0.2}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Exports ──────────────────────────────────────────────
export function MessageBubble({ message, isTyping }) {
  if (isTyping) return <TypingIndicator />;
  if (message.role === 'user') return <UserBubble message={message} />;
  return <AssistantBubble message={message} />;
}

// ─── Helpers ──────────────────────────────────────────────
function formatTime(date) {
  if (!date) return '';
  return new Intl.DateTimeFormat('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(date));
}
