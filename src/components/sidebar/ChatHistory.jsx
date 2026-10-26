import React, { useState, useEffect } from 'react';
import { clsx } from 'clsx';
import { Trash2 } from 'lucide-react';
import { CONVERSATION_GROUPS } from '../../data/mockConversations';

function ChatItem({ conv, isActive, onClick, onDelete }) {
  const [confirming, setConfirming] = useState(false);

  const handleDelete = (e) => {
    e.stopPropagation();
    if (!confirming) {
      setConfirming(true);
      return;
    }
    onDelete?.(conv.id, e);
  };

  useEffect(() => {
    if (confirming) {
      const timer = setTimeout(() => setConfirming(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [confirming]);

  return (
    <div
      onClick={() => onClick(conv.id)}
      className={clsx(
        'w-full text-left px-3 py-2 rounded-xl transition-all duration-150 group relative flex items-center justify-between cursor-pointer select-none',
        isActive
          ? 'bg-[var(--accent-green-light)] text-palm-800 dark:text-palm-300'
          : 'hover:bg-[var(--border-subtle)] text-[var(--text-secondary)]'
      )}
    >
      {/* Active indicator */}
      {isActive && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-palm-600 dark:bg-palm-400 rounded-r-full" />
      )}

      <div className="flex-1 min-w-0 pr-1.5">
        <p
          className={clsx(
            'text-sm font-medium truncate leading-tight',
            isActive ? 'text-[var(--accent-green)] dark:text-palm-300' : 'text-[var(--text-primary)]'
          )}
        >
          {conv.title}
        </p>
        <p className="text-xs text-[var(--text-muted)] truncate mt-0.5 leading-tight">
          {conv.preview || 'No messages yet'}
        </p>
      </div>

      {/* Delete button (ChatGPT-style) */}
      <button
        type="button"
        onClick={handleDelete}
        className={clsx(
          'p-1.5 rounded-lg transition-all flex-shrink-0',
          confirming
            ? 'opacity-100 bg-red-500 hover:bg-red-600 text-white shadow-xs'
            : 'opacity-0 group-hover:opacity-100 focus:opacity-100 text-[var(--text-muted)] hover:text-red-500 hover:bg-black/5 dark:hover:bg-white/10'
        )}
        title={confirming ? 'Click again to confirm delete' : 'Delete chat'}
        aria-label="Delete chat"
      >
        {confirming ? (
          <span className="text-[10px] font-bold px-1">Delete?</span>
        ) : (
          <Trash2 size={14} />
        )}
      </button>
    </div>
  );
}

export function ChatHistoryGroup({ group, conversations, activeConvId, onSelect, onDelete }) {
  const items = conversations.filter((c) => c.group === group);
  if (items.length === 0) return null;

  return (
    <div className="mb-4">
      <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)] mb-1">
        {group}
      </p>
      <div className="flex flex-col gap-0.5">
        {items.map((conv) => (
          <ChatItem
            key={conv.id}
            conv={conv}
            isActive={conv.id === activeConvId}
            onClick={onSelect}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  );
}

export function ChatHistory({ conversations, activeConvId, onSelect, onDelete }) {
  return (
    <div className="flex-1 overflow-y-auto py-2 px-2">
      {CONVERSATION_GROUPS.map((group) => (
        <ChatHistoryGroup
          key={group}
          group={group}
          conversations={conversations}
          activeConvId={activeConvId}
          onSelect={onSelect}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
