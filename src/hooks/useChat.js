import { useState, useCallback, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { analyseImage, analyseText } from '../services/geminiVision';
import {
  extractPreferences,
  getStoredMemory,
  saveStoredMemory,
} from '../services/memoryService';
import {
  getSessions,
  createSession,
  deleteSession,
  getMessages,
  addMessage,
} from '../services/dbService';

let nextTempId = 1;

/** Extract base64 data and mimeType from a data URL */
function parseDataUrl(dataUrl) {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return null;
  return { mimeType: match[1], base64: match[2] };
}

/** Build conversation history for Gemini context (last 30 messages) */
function buildHistory(messages) {
  return messages
    .filter((m) => m.type === 'text' && m.content)
    .slice(-30)
    .map((m) => ({ role: m.role, content: m.content }));
}

/** Map a Firestore message doc → UI message shape */
function toUiMessage(doc) {
  return {
    id:          doc.id,
    role:        doc.role,        // 'user' | 'assistant'
    type:        'text',
    content:     doc.content,
    attachments: doc.imageUrl ? [{ dataUrl: doc.imageUrl }] : [],
    timestamp:   doc.timestamp ? new Date(doc.timestamp) : new Date(),
  };
}

/** Map a Firestore session doc → UI conversation shape */
function toUiConv(doc, isActive = false) {
  return {
    id:        doc.id,
    title:     doc.title || 'New conversation',
    preview:   doc.title || '',
    group:     'Today',
    timestamp: doc.updatedAt ? new Date(doc.updatedAt) : new Date(),
    active:    isActive,
  };
}

export function useChat() {
  const { user } = useAuth();

  const [conversations, setConversations] = useState([]);
  const [activeConvId, setActiveConvId]   = useState(null);
  const [messages, setMessages]           = useState([]);
  const [isTyping, setIsTyping]           = useState(false);
  const [isNewChat, setIsNewChat]         = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [userMemory, setUserMemory]       = useState(() => getStoredMemory(user));
  const abortRef = useRef(false);

  // ── Sync user memory when user changes or event fires ─────
  useEffect(() => {
    setUserMemory(getStoredMemory(user));
    const handleMemoryUpdate = (e) => {
      if (e.detail) setUserMemory(e.detail);
    };
    window.addEventListener('anna_sakhi_memory_updated', handleMemoryUpdate);
    return () => window.removeEventListener('anna_sakhi_memory_updated', handleMemoryUpdate);
  }, [user]);

  const addUserMemory = useCallback((item) => {
    if (!item || !item.trim()) return;
    const clean = item.trim();
    setUserMemory((prev) => {
      if (prev.includes(clean)) return prev;
      const next = [...prev, clean];
      saveStoredMemory(user, next);
      return next;
    });
  }, [user]);

  const removeUserMemory = useCallback((item) => {
    setUserMemory((prev) => {
      const next = prev.filter((m) => m !== item);
      saveStoredMemory(user, next);
      return next;
    });
  }, [user]);

  // ── Load sessions on mount / user change ─────────────────
  useEffect(() => {
    if (!user) {
      setConversations([]);
      setMessages([]);
      setActiveConvId(null);
      return;
    }
    loadSessions();
  }, [user]);

  const loadSessions = useCallback(async () => {
    try {
      const sessions = await getSessions(user);
      const uiConvs = sessions.map((s, i) => toUiConv(s, i === 0));
      setConversations(uiConvs);
      if (sessions.length > 0) {
        setActiveConvId(sessions[0].id);
        await loadMessagesForSession(sessions[0].id);
      }
    } catch (err) {
      console.error('[useChat] Failed to load sessions:', err.message);
    }
  }, [user]);

  const loadMessagesForSession = useCallback(async (sessionId) => {
    if (!user || !sessionId) return;
    setLoadingHistory(true);
    try {
      const msgs = await getMessages(user, sessionId);
      setMessages(msgs.map(toUiMessage));
    } catch (err) {
      console.error('[useChat] Failed to load messages:', err.message);
      setMessages([]);
    } finally {
      setLoadingHistory(false);
    }
  }, [user]);

  // ── Start a new chat ──────────────────────────────────────
  const startNewChat = useCallback(async () => {
    if (!user) return;
    try {
      const { id } = await createSession(user, 'New conversation');
      const newConv = {
        id,
        title:     'New conversation',
        preview:   '',
        group:     'Today',
        timestamp: new Date(),
        active:    true,
      };
      setConversations((prev) => [
        newConv,
        ...prev.map((c) => ({ ...c, active: false })),
      ]);
      setActiveConvId(id);
      setMessages([]);
      setIsNewChat(true);
    } catch (err) {
      console.error('[useChat] Failed to create session:', err.message);
    }
  }, [user]);

  // ── Select a conversation ─────────────────────────────────
  const selectConversation = useCallback(async (convId) => {
    if (convId === activeConvId) return;
    setConversations((prev) =>
      prev.map((c) => ({ ...c, active: c.id === convId }))
    );
    setActiveConvId(convId);
    setIsNewChat(false);
    await loadMessagesForSession(convId);
  }, [activeConvId, loadMessagesForSession]);

  // ── Send a message ────────────────────────────────────────
  const sendMessage = useCallback(async (payload) => {
    const isPlain    = typeof payload === 'string';
    const text       = isPlain ? payload : (payload.text || '');
    const attachments = isPlain ? [] : (payload.attachments || []);

    if (!text.trim() && attachments.length === 0) return;
    if (isTyping) return;

    // ── Ensure we have an active session ───────────────────
    let sessionId = activeConvId;
    if (!sessionId || isNewChat) {
      try {
        const title = text ? (text.length > 40 ? text.slice(0, 40) + '…' : text) : '📷 Image';
        const { id } = await createSession(user, title);
        sessionId = id;
        const newConv = {
          id,
          title,
          preview: title,
          group:   'Today',
          timestamp: new Date(),
          active:  true,
        };
        setConversations((prev) => [
          newConv,
          ...prev.map((c) => ({ ...c, active: false })),
        ]);
        setActiveConvId(id);
        setIsNewChat(false);
      } catch (err) {
        console.error('[useChat] Failed to create session:', err.message);
      }
    }

    // ── Optimistically add user message to UI ──────────────
    const tempId = `temp-${nextTempId++}`;
    const userMsg = {
      id:          tempId,
      role:        'user',
      type:        'text',
      content:     text,
      attachments,
      timestamp:   new Date(),
    };
    setMessages((prev) => {
      // Update sidebar title on first message
      if (prev.length === 0) {
        const preview = text || '📷 Image';
        const title   = preview.length > 40 ? preview.slice(0, 40) + '…' : preview;
        setConversations((cs) =>
          cs.map((c) => (c.id === sessionId ? { ...c, title, preview } : c))
        );
      }
      return [...prev, userMsg];
    });

    setIsTyping(true);
    abortRef.current = false;

    try {
      // ── Persist user message to Firestore ─────────────────
      if (user && sessionId) {
        addMessage(user, sessionId, { role: 'user', content: text }).catch(
          (e) => console.warn('[useChat] Failed to save user msg:', e.message)
        );
      }

      // ── Detect and persist user preferences / go-to foods ──
      const detectedPref = extractPreferences(text);
      let activeMemory = userMemory;
      if (detectedPref && !activeMemory.some((m) => m.toLowerCase() === detectedPref.toLowerCase())) {
        activeMemory = [...activeMemory, detectedPref];
        setUserMemory(activeMemory);
        saveStoredMemory(user, activeMemory);
      }

      // ── Call Gemini ────────────────────────────────────────
      let responseText = null;

      if (attachments.length > 0) {
        const parsed = parseDataUrl(attachments[0].dataUrl);
        if (parsed) {
          responseText = await analyseImage(parsed.base64, parsed.mimeType, text);
        }
      } else {
        responseText = await analyseText(text, buildHistory(messages), activeMemory);
      }

      if (abortRef.current) return;

      if (!responseText) {
        responseText = "I'm having a little trouble right now. 😅 Please try again in a moment!";
      }

      const assistantMsg = {
        id:          `ai-${nextTempId++}`,
        role:        'assistant',
        type:        'text',
        content:     responseText,
        attachments: [],
        timestamp:   new Date(),
      };
      setMessages((prev) => [...prev, assistantMsg]);

      // ── Persist assistant message to Firestore ─────────────
      if (user && sessionId) {
        addMessage(user, sessionId, { role: 'assistant', content: responseText }).catch(
          (e) => console.warn('[useChat] Failed to save assistant msg:', e.message)
        );
      }
    } catch (err) {
      console.error('[Anna Sakhi] Error:', err);
      if (abortRef.current) return;
      setMessages((prev) => [
        ...prev,
        {
          id:          `err-${nextTempId++}`,
          role:        'assistant',
          type:        'text',
          content:     `Oops, something went wrong. 😅 ${
            err?.message?.includes('API_KEY')
              ? 'Please check your Gemini API key in `server/.env`.'
              : 'Please try again in a moment!'
          }`,
          attachments: [],
          timestamp:   new Date(),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  }, [isTyping, isNewChat, activeConvId, messages, user, userMemory]);

  return {
    conversations,
    activeConvId,
    messages,
    isTyping,
    isNewChat,
    loadingHistory,
    userMemory,
    addUserMemory,
    removeUserMemory,
    startNewChat,
    selectConversation,
    sendMessage,
  };
}
