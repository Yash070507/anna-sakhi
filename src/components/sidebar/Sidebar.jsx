import React from 'react';
import { SquarePen } from 'lucide-react';
import { ChatHistory } from './ChatHistory';
import { UserMenu } from './UserMenu';

/**
 * Sidebar inner content — shared between desktop sidebar and mobile drawer
 */
export function SidebarContent({ conversations, activeConvId, onSelectConv, onNewChat, onDeleteConv, onClose }) {
  return (
    <div className="flex flex-col h-full bg-[var(--bg-sidebar)]">
      {/* ── Branding header ── */}
      <div className="flex items-center justify-between px-4 pt-5 pb-4 border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-palm-600 to-sea-600 flex items-center justify-center shadow-sm">
            <span className="text-base" role="img" aria-label="Anna Sakhi">🌴</span>
          </div>
          <div>
            <h1 className="font-display text-lg font-semibold text-[var(--text-primary)] leading-tight tracking-tight">
              Anna Sakhi
            </h1>
            <p className="text-[10px] text-[var(--text-muted)] font-medium tracking-wider uppercase leading-none">
              Kitchen Companion
            </p>
          </div>
        </div>

        {/* New Chat button (icon) */}
        <button
          onClick={() => { onNewChat(); onClose?.(); }}
          className="p-2 rounded-lg btn-ghost text-[var(--text-secondary)]"
          title="New Chat"
          aria-label="Start new chat"
        >
          <SquarePen size={18} />
        </button>
      </div>

      {/* ── New Chat CTA ── */}
      <div className="px-3 pt-3 pb-1">
        <button
          onClick={() => { onNewChat(); onClose?.(); }}
          className="w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl border border-dashed border-[var(--border-medium)] text-[var(--text-secondary)] text-sm font-medium hover:bg-[var(--border-subtle)] hover:text-[var(--text-primary)] transition-all duration-150 group"
        >
          <span className="w-5 h-5 rounded-md bg-terracotta-500 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
            <svg viewBox="0 0 12 12" className="w-3 h-3 text-white fill-current">
              <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </span>
          New conversation
        </button>
      </div>

      {/* ── Chat history ── */}
      <ChatHistory
        conversations={conversations}
        activeConvId={activeConvId}
        onSelect={(id) => { onSelectConv(id); onClose?.(); }}
        onDelete={onDeleteConv}
      />

      {/* ── User menu ── */}
      <div className="px-3 pb-4 pt-2 border-t border-[var(--border-subtle)]">
        <UserMenu />
      </div>
    </div>
  );
}

/**
 * Desktop sidebar — fixed, always visible on md+
 */
export function Sidebar({ conversations, activeConvId, onSelectConv, onNewChat, onDeleteConv }) {
  return (
    <aside
      className="hidden md:flex flex-col w-[280px] flex-shrink-0 border-r border-[var(--border-subtle)] h-full"
      aria-label="Sidebar"
    >
      <SidebarContent
        conversations={conversations}
        activeConvId={activeConvId}
        onSelectConv={onSelectConv}
        onNewChat={onNewChat}
        onDeleteConv={onDeleteConv}
      />
    </aside>
  );
}
