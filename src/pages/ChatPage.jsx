import React, { useState, useCallback } from 'react';
import { Menu } from 'lucide-react';
import { Sidebar, SidebarContent } from '../components/sidebar/Sidebar';
import { Drawer } from '../components/ui/Drawer';
import { MessageList } from '../components/chat/MessageList';
import { WelcomeState } from '../components/chat/WelcomeState';
import { Composer } from '../components/chat/Composer';
import { ThemeToggle } from '../components/ui/ThemeToggle';
import { useChat } from '../hooks/useChat';

export default function ChatPage() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const {
    conversations,
    activeConvId,
    messages,
    isTyping,
    isNewChat,
    loadingHistory,
    startNewChat,
    selectConversation,
    sendMessage,
  } = useChat();

  const handlePromptSelect = useCallback((query) => {
    sendMessage({ text: query, attachments: [] });
  }, [sendMessage]);

  const showWelcome = messages.length === 0;

  return (
    <div className="flex h-screen bg-[var(--bg-primary)] overflow-hidden">
      {/* ── Desktop sidebar ── */}
      <Sidebar
        conversations={conversations}
        activeConvId={activeConvId}
        onSelectConv={selectConversation}
        onNewChat={startNewChat}
      />

      {/* ── Mobile drawer ── */}
      <Drawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <SidebarContent
          conversations={conversations}
          activeConvId={activeConvId}
          onSelectConv={selectConversation}
          onNewChat={startNewChat}
          onClose={() => setDrawerOpen(false)}
        />
      </Drawer>

      {/* ── Main content ── */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* ── Mobile top bar ── */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 border-b border-[var(--border-subtle)] bg-[var(--bg-sidebar)] flex-shrink-0">
          <button
            onClick={() => setDrawerOpen(true)}
            className="p-2 rounded-xl btn-ghost text-[var(--text-secondary)]"
            aria-label="Open sidebar"
          >
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2">
            <span className="text-lg">🌴</span>
            <span className="font-display text-lg font-semibold text-[var(--text-primary)]">
              Anna Sakhi
            </span>
          </div>
          <ThemeToggle />
        </header>

        {/* ── Chat area ── */}
        <main className="flex flex-col flex-1 min-h-0">
          {loadingHistory ? (
            // Loading skeleton while switching sessions
            <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className={`flex gap-3 ${i % 2 === 0 ? '' : 'flex-row-reverse'}`}
                >
                  <div className="w-8 h-8 rounded-full bg-[var(--bg-surface)] animate-pulse flex-shrink-0" />
                  <div
                    className="h-10 rounded-2xl bg-[var(--bg-surface)] animate-pulse"
                    style={{ width: `${45 + (i * 13) % 30}%` }}
                  />
                </div>
              ))}
            </div>
          ) : showWelcome ? (
            <div className="flex-1 overflow-y-auto">
              <WelcomeState onPromptSelect={handlePromptSelect} />
            </div>
          ) : (
            <MessageList messages={messages} isTyping={isTyping} />
          )}

          {/* ── Composer ── */}
          <Composer onSend={sendMessage} disabled={isTyping} />
        </main>
      </div>
    </div>
  );
}
