import { useRef, useState, useCallback } from 'react';
import { GoogleGenAI } from '@google/genai';

const MODEL   = 'gemini-3.1-flash-live-preview';


const FRAME_SIZE = 768; // recommended by Live API docs
const FPS_MS     = 1000; // 1 frame per second

const SYSTEM_PROMPT = `You are Anna Sakhi, a warm and knowledgeable Konkan kitchen companion watching through a live camera.
Observe what you see continuously and provide brief, insightful commentary:
- Identify visible ingredients with as much precision as possible. Estimate quantities (e.g. "about 2 medium tomatoes", "a small bunch of curry leaves").
- Recognise prepared dishes and describe them.
- Note freshness, quality, or preparation stage.
- Suggest Konkan or South Indian coastal recipes that could be made with what you see.
Keep each response to 2-4 sentences. Be conversational, warm, and encouraging.
If nothing food-related is visible, gently say so and invite the user to show you their kitchen or ingredients.
CRITICAL: Never ask the user to adjust API settings or enable 'precise ingredient identification'. You are fully capable of identifying ingredients as-is.`;

let msgSeq = 0;

/**
 * useLiveSession — manages a Gemini Live WebSocket session.
 *
 * Returns:
 *   status         – 'idle' | 'connecting' | 'connected' | 'error'
 *   transcript     – [{ id, role: 'anna'|'user', text, streaming }]
 *   error          – string | null
 *   connect()      – open session, returns boolean success
 *   startStreaming(videoRef) – begin 1fps frame loop
 *   stopStreaming() – pause frame loop (session stays open)
 *   disconnect()   – close session + stop streaming
 *   ask(text)      – send a user text turn
 */
export function useLiveSession() {
  const [status,     setStatus]     = useState('idle');
  const [transcript, setTranscript] = useState([]);
  const [error,      setError]      = useState(null);

  const sessionRef       = useRef(null);
  const intervalRef      = useRef(null);
  const offscreenCanvas  = useRef(null);
  const currentIdRef     = useRef(null); // id of the message currently streaming in

  // ── Transcript helpers ──────────────────────────────────
  const addUserMsg = useCallback((text) => {
    const id = ++msgSeq;
    setTranscript(prev => [...prev, { id, role: 'user', text, streaming: false }]);
  }, []);

  const openAnnaMsg = useCallback(() => {
    const id = ++msgSeq;
    currentIdRef.current = id;
    setTranscript(prev => [...prev, { id, role: 'anna', text: '', streaming: true }]);
  }, []);

  const appendAnna = useCallback((chunk) => {
    const targetId = currentIdRef.current;
    setTranscript(prev =>
      prev.map(m =>
        m.id === targetId ? { ...m, text: m.text + chunk } : m
      )
    );
  }, []);

  const closeAnnaMsg = useCallback(() => {
    const targetId = currentIdRef.current;
    setTranscript(prev =>
      prev.map(m => m.id === targetId ? { ...m, streaming: false } : m)
    );
    currentIdRef.current = null;
  }, []);

  // ── Frame capture ───────────────────────────────────────
  const captureFrame = useCallback((videoEl) => {
    if (!videoEl?.videoWidth) return null;
    if (!offscreenCanvas.current) {
      offscreenCanvas.current = document.createElement('canvas');
    }
    const c = offscreenCanvas.current;
    c.width  = FRAME_SIZE;
    c.height = FRAME_SIZE;
    const ctx = c.getContext('2d');
    // Center-crop to square
    const vw = videoEl.videoWidth;
    const vh = videoEl.videoHeight;
    const side = Math.min(vw, vh);
    const sx = (vw - side) / 2;
    const sy = (vh - side) / 2;
    ctx.drawImage(videoEl, sx, sy, side, side, 0, 0, FRAME_SIZE, FRAME_SIZE);
    const dataUrl = c.toDataURL('image/jpeg', 0.8);
    return dataUrl.split(',')[1]; // raw base64 only
  }, []);

  // ── Connect ─────────────────────────────────────────────
  const connect = useCallback(async () => {
    setStatus('connecting');
    setError(null);
    setTranscript([]);
    currentIdRef.current = null;

    // Fetch the key from the backend (local-network-only endpoint)
    let apiKey;
    try {
      const apiBase = import.meta.env.VITE_API_BASE_URL || '';
      const res = await fetch(`${apiBase}/api/live-key`);
      if (!res.ok) throw new Error(`Server responded ${res.status}`);
      const data = await res.json();
      apiKey = data.key;
      if (!apiKey) throw new Error('No key returned from server');
    } catch (fetchErr) {
      const msg = fetchErr?.message?.includes('Failed to fetch')
        ? 'Backend server not running. Start it with: npm run dev:full'
        : `Could not get Live API key: ${fetchErr.message}`;
      setError(msg);
      setStatus('error');
      return false;
    }

    try {
      const ai = new GoogleGenAI({ apiKey });
      let msgOpen = false; // is there an open anna message?

      const session = await ai.live.connect({
        model: MODEL,
        config: {
          responseModalities: ['TEXT'],
          systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        },
        callbacks: {
          onopen: () => {
            setStatus('connected');
          },
          onmessage: (msg) => {
            // Streaming text chunks
            const parts = msg?.serverContent?.modelTurn?.parts;
            if (parts?.length) {
              parts.forEach(part => {
                if (typeof part.text === 'string' && part.text) {
                  if (!msgOpen) { openAnnaMsg(); msgOpen = true; }
                  appendAnna(part.text);
                }
              });
            }
            // Turn complete signal
            if (msg?.serverContent?.turnComplete) {
              if (msgOpen) { closeAnnaMsg(); msgOpen = false; }
            }
          },
          onerror: (err) => {
            console.error('[Anna Live]', err);
            const msg = err?.message || String(err) || 'Connection error';
            setError(msg);
            setStatus('error');
          },
          onclose: () => {
            setStatus('idle');
          },
        },
      });

      sessionRef.current = session;
      return true;
    } catch (err) {
      console.error('[Anna Live] connect failed:', err);
      setError(err?.message || 'Failed to connect to Gemini Live');
      setStatus('error');
      return false;
    }
  }, [openAnnaMsg, appendAnna, closeAnnaMsg]);

  // ── Streaming ───────────────────────────────────────────
  const startStreaming = useCallback((videoRef) => {
    if (!sessionRef.current || intervalRef.current) return;

    intervalRef.current = setInterval(() => {
      const video = videoRef.current;
      if (!video) return;
      const base64 = captureFrame(video);
      if (!base64) return;
      try {
        sessionRef.current?.sendRealtimeInput({
          video: { data: base64, mimeType: 'image/jpeg' },
        });
      } catch (e) {
        // session may have closed — ignore
      }
    }, FPS_MS);
  }, [captureFrame]);

  const stopStreaming = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // ── Disconnect ──────────────────────────────────────────
  const disconnect = useCallback(() => {
    stopStreaming();
    try { sessionRef.current?.close(); } catch (_) {}
    sessionRef.current = null;
    currentIdRef.current = null;
    setStatus('idle');
    setTranscript([]);
    setError(null);
  }, [stopStreaming]);

  // ── Ask ─────────────────────────────────────────────────
  const ask = useCallback((text) => {
    if (!sessionRef.current || !text.trim()) return;
    addUserMsg(text.trim());
    try {
      sessionRef.current.sendClientContent({
        turns: [{ role: 'user', parts: [{ text: text.trim() }] }],
      });
    } catch (e) {
      console.warn('[Anna Live] ask error:', e);
    }
  }, [addUserMsg]);

  return {
    status,
    transcript,
    error,
    connect,
    startStreaming,
    stopStreaming,
    disconnect,
    ask,
  };
}
