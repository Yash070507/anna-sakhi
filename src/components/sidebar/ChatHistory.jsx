import React from 'react';
import { clsx } from 'clsx';
import { CONVERSATION_GROUPS } from '../../data/mockConversations';

function ChatItem({ conv, isActive, onClick }) {
  return (
    <button
      onClick={() => onClick(conv.id)}
      className={clsx(
        'w-full text-left px-3 py-2.5 rounded-xl transition-all duration-150 group relative',
        isActive
          ? 'bg-[var(--accent-green-light)] text-palm-800 dark:text-palm-300'
          : 'hover:bg-[var(--border-subtle)] text-[var(--text-secondary)]'
      )}
    >
      {/* Active indicator */}
      {isActive && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-palm-600 dark:bg-palm-400 rounded-r-full" />
      )}

      <p
        className={clsx(
          'text-sm font-medium truncate leading-tight',
          isActive ? 'text-[var(--accent-green)] dark:text-palm-300' : 'text-[var(--text-primary)]'
        )}
      >
        {conv.title}
      </p>
      <p className="text-xs text-[var(--text-muted)] truncate mt-0.5 leading-tight">
        {conv.preview}
      </p>
    </button>
  );
}

export function ChatHistoryGroup({ group, conversations, activeConvId, onSelect }) {
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
          />
        ))}
      </div>
    </div>
  );
}

export function ChatHistory({ conversations, activeConvId, onSelect }) {
  return (
    <div className="flex-1 overflow-y-auto py-2 px-2">
      {CONVERSATION_GROUPS.map((group) => (
        <ChatHistoryGroup
          key={group}
          group={group}
          conversations={conversations}
          activeConvId={activeConvId}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}
