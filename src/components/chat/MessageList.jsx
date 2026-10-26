import React, { useEffect, useRef } from 'react';
import { MessageBubble } from './MessageBubble';

export function MessageList({ messages, isTyping }) {
  const bottomRef = useRef(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  return (
    <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6">
      <div className="max-w-3xl mx-auto">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}

        {isTyping && <MessageBubble isTyping />}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}
