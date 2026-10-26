import React, {
  useCallback, useEffect, useRef, useState,
} from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, RefreshCw, ImageIcon, AlertTriangle, Send, Scan } from 'lucide-react';
import { clsx } from 'clsx';
import { useCameraStream }  from '../../hooks/useCameraStream';
import { useLiveSession }   from '../../hooks/useLiveSession';

let snapId = 0;

/**
 * LiveCameraAssistant — full-screen live camera with Gemini Live analysis.
 *
 * Props:
 *   isOpen        – boolean
 *   onClose()     – called on close
 *   onCapture({ id, dataUrl, name }) – called when user taps snapshot button
 */
export function LiveCameraAssistant({ isOpen, onClose, onCapture }) {
  const cam  = useCameraStream();
  const live = useLiveSession();

  const [question, setQuestion]   = useState('');
  const [flash,    setFlash]      = useState(false);
  const transcriptEndRef          = useRef(null);
  const inputRef                  = useRef(null);
  const galleryInputRef           = useRef(null);

  // ── Lifecycle ─────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) {
      live.disconnect();
      cam.stop();
      return;
    }
    // Start camera, then connect live session, then start streaming
    (async () => {
      const ok = await live.connect();
      if (ok) live.startStreaming(cam.videoRef);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Stop streaming when camera not ready yet (edge case)
  useEffect(() => {
    if (isOpen && cam.isReady && live.status === 'connected') {
      live.startStreaming(cam.videoRef);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cam.isReady]);

  // Auto-scroll transcript
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [live.transcript]);

  // Escape key
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') handleClose(); };
    if (isOpen) window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleClose = useCallback(() => {
    live.disconnect();
    cam.stop();
    onClose();
  }, [live, cam, onClose]);

  // ── Snapshot ──────────────────────────────────────────────
  const handleCapture = useCallback(() => {
    const snapshot = cam.capture();
    if (!snapshot) return;
    setFlash(true);
    setTimeout(() => setFlash(false), 250);
    setTimeout(() => {
      live.disconnect();
      cam.stop();
      onCapture({ ...snapshot, id: ++snapId });
      onClose();
    }, 180);
  }, [cam, live, onCapture, onClose]);

  // ── Gallery fallback ──────────────────────────────────────
  const handleGallery = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      live.disconnect();
      cam.stop();
      onCapture({ dataUrl: ev.target.result, name: file.name, id: ++snapId });
      onClose();
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  }, [live, cam, onCapture, onClose]);

  // ── Ask question ──────────────────────────────────────────
  const handleAsk = useCallback(() => {
    if (!question.trim()) return;
    live.ask(question);
    setQuestion('');
    inputRef.current?.focus();
  }, [question, live]);

  const handleAskKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAsk(); }
  };

  // ── Status badge ──────────────────────────────────────────
  const statusBadge = {
    idle:       { label: 'Starting…',  cls: 'bg-white/20 text-white/70' },
    connecting: { label: 'Connecting…',cls: 'bg-white/20 text-white/70' },
    connected:  { label: '● LIVE',     cls: 'bg-red-500 text-white animate-pulse' },
    error:      { label: '✕ Error',    cls: 'bg-terracotta-700 text-white' },
  }[live.status] ?? { label: '…', cls: 'bg-white/20 text-white/70' };

  const portal = document.getElementById('root');

  return ReactDOM.createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="live-camera-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[100] flex flex-col bg-black"
          aria-modal="true"
          role="dialog"
          aria-label="Live camera assistant"
        >
          {/* ── Video feed ── */}
          <div className="relative flex-1 overflow-hidden">
            <video
              ref={cam.videoRef}
              autoPlay
              playsInline
              muted
              className={clsx(
                'absolute inset-0 w-full h-full object-cover',
                cam.facingMode === 'user' && 'scale-x-[-1]'
              )}
              aria-label="Live camera view"
            />

            {/* Camera loading */}
            {!cam.isReady && !cam.error && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/80">
                <div className="w-10 h-10 rounded-full border-2 border-palm-400 border-t-transparent animate-spin" />
                <p className="text-white/70 text-sm">Starting camera…</p>
              </div>
            )}

            {/* Camera error */}
            {cam.error && (
              <CameraError
                error={cam.error}
                onGallery={() => galleryInputRef.current?.click()}
                onClose={handleClose}
              />
            )}

            {/* Live API error (only if camera is OK) */}
            {!cam.error && live.status === 'error' && (
              <LiveError
                error={live.error}
                onClose={handleClose}
              />
            )}

            {/* Flash */}
            <AnimatePresence>
              {flash && (
                <motion.div
                  key="flash"
                  initial={{ opacity: 0.9 }}
                  animate={{ opacity: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="absolute inset-0 bg-white pointer-events-none z-10"
                />
              )}
            </AnimatePresence>

            {/* ── Top HUD ── */}
            {!cam.error && (
              <div className="absolute top-0 inset-x-0 flex items-center justify-between px-4 pt-6 pb-4 bg-gradient-to-b from-black/70 to-transparent z-10">
                {/* Identity */}
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-palm-600 to-sea-600 flex items-center justify-center shadow-lg">
                    <span className="text-base" role="img" aria-label="Anna Sakhi">🌴</span>
                  </div>
                  <div>
                    <p className="text-white text-sm font-semibold leading-none">Anna Sakhi</p>
                    <p className="text-white/60 text-[11px] mt-0.5">Live Kitchen Vision</p>
                  </div>
                </div>

                {/* Status badge + close */}
                <div className="flex items-center gap-2">
                  <span className={clsx(
                    'text-[11px] font-semibold px-2.5 py-1 rounded-full',
                    statusBadge.cls
                  )}>
                    {statusBadge.label}
                  </span>
                  <button
                    type="button"
                    onClick={handleClose}
                    className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/60 transition-colors"
                    aria-label="Close live camera"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>
            )}

            {/* ── Viewfinder corners ── */}
            {cam.isReady && !cam.error && <ViewfinderCorners active={live.status === 'connected'} />}

            {/* ── Transcript card ── */}
            {!cam.error && live.transcript.length > 0 && (
              <div className="absolute bottom-28 inset-x-4 z-10">
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="max-h-44 overflow-y-auto rounded-2xl bg-black/70 backdrop-blur-md border border-white/10 px-4 py-3 space-y-2"
                >
                  {live.transcript.map((msg) => (
                    <div key={msg.id} className={clsx(
                      'text-sm leading-relaxed',
                      msg.role === 'anna' ? 'text-palm-200' : 'text-white/70'
                    )}>
                      {msg.role === 'user' && (
                        <span className="text-white/40 text-[10px] font-semibold mr-1 uppercase tracking-wider">You: </span>
                      )}
                      {msg.text}
                      {msg.streaming && (
                        <motion.span
                          className="inline-block w-0.5 h-3.5 bg-palm-400 ml-0.5 align-middle"
                          animate={{ opacity: [1, 0] }}
                          transition={{ duration: 0.7, repeat: Infinity }}
                        />
                      )}
                    </div>
                  ))}
                  <div ref={transcriptEndRef} />
                </motion.div>
              </div>
            )}

            {/* Scanning hint when connected but no transcript yet */}
            {cam.isReady && !cam.error && live.status === 'connected' && live.transcript.length === 0 && (
              <div className="absolute bottom-32 inset-x-0 flex flex-col items-center gap-2 pointer-events-none z-10">
                <motion.div
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="flex items-center gap-2 text-palm-300"
                >
                  <Scan size={16} />
                  <span className="text-xs font-medium tracking-wide">Anna is watching…</span>
                </motion.div>
              </div>
            )}
          </div>

          {/* ── Bottom controls ── */}
          {!cam.error && live.status !== 'error' && (
            <div className="bg-black/95 backdrop-blur-sm border-t border-white/10 px-4 pt-3 pb-6">
              {/* Ask input row */}
              <div className="flex items-center gap-2 mb-3">
                <input
                  ref={inputRef}
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyDown={handleAskKey}
                  placeholder="Ask Anna about what she sees…"
                  className="flex-1 bg-white/10 border border-white/15 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-palm-500 transition-colors"
                  aria-label="Ask Anna a question"
                />
                <button
                  type="button"
                  onClick={handleAsk}
                  disabled={!question.trim() || live.status !== 'connected'}
                  className={clsx(
                    'w-10 h-10 rounded-xl flex items-center justify-center transition-all',
                    question.trim() && live.status === 'connected'
                      ? 'bg-palm-600 text-white hover:bg-palm-500'
                      : 'bg-white/10 text-white/30 cursor-not-allowed'
                  )}
                  aria-label="Send question"
                >
                  <Send size={16} />
                </button>
              </div>

              {/* Camera action buttons */}
              <div className="flex items-center justify-between">
                {/* Flip */}
                <button
                  type="button"
                  onClick={cam.flip}
                  className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
                  aria-label="Flip camera"
                >
                  <RefreshCw size={19} />
                </button>

                {/* Capture */}
                <button
                  type="button"
                  onClick={handleCapture}
                  disabled={!cam.isReady}
                  className={clsx(
                    'relative w-20 h-20 rounded-full transition-all',
                    cam.isReady ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'
                  )}
                  aria-label="Take snapshot and send to chat"
                  title="Snapshot → send to chat"
                >
                  {cam.isReady && (
                    <motion.div
                      className="absolute inset-0 rounded-full border-2 border-white/50"
                      animate={{ scale: [1, 1.12, 1], opacity: [0.5, 0.15, 0.5] }}
                      transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                    />
                  )}
                  <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center shadow-2xl">
                    <div className="w-14 h-14 rounded-full bg-palm-600" />
                  </div>
                </button>

                {/* Gallery */}
                <button
                  type="button"
                  onClick={() => galleryInputRef.current?.click()}
                  className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
                  aria-label="Upload from gallery"
                >
                  <ImageIcon size={19} />
                </button>
              </div>

              <p className="text-center text-white/30 text-[10px] mt-3 font-medium">
                Capture sends snapshot to chat · Ask to speak with Anna
              </p>
            </div>
          )}

          {/* Hidden gallery input */}
          <input
            ref={galleryInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleGallery}
            aria-label="Upload image from gallery"
          />
        </motion.div>
      )}
    </AnimatePresence>,
    portal
  );
}

// ─── Viewfinder corners ────────────────────────────────────
function ViewfinderCorners({ active }) {
  const corner = 'absolute w-8 h-8 border-white/70';
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <motion.div
        className="relative w-56 h-56 md:w-72 md:h-72"
        animate={active
          ? { opacity: [0.6, 1, 0.6] }
          : { opacity: 0.3 }
        }
        transition={{ duration: 2.5, repeat: active ? Infinity : 0, ease: 'easeInOut' }}
      >
        <div className={clsx(corner, 'top-0 left-0 border-t-2 border-l-2 rounded-tl-lg')} />
        <div className={clsx(corner, 'top-0 right-0 border-t-2 border-r-2 rounded-tr-lg')} />
        <div className={clsx(corner, 'bottom-0 left-0 border-b-2 border-l-2 rounded-bl-lg')} />
        <div className={clsx(corner, 'bottom-0 right-0 border-b-2 border-r-2 rounded-br-lg')} />
      </motion.div>
    </div>
  );
}

// ─── Camera error ──────────────────────────────────────────
function CameraError({ error, onGallery, onClose }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 bg-black/90 px-8 text-center z-20">
      <button
        type="button" onClick={onClose}
        className="absolute top-6 right-4 w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
        aria-label="Close"
      >
        <X size={18} />
      </button>
      <div className="w-16 h-16 rounded-2xl bg-red-900/40 border border-red-600/40 flex items-center justify-center">
        <AlertTriangle size={28} className="text-red-400" />
      </div>
      <div>
        <p className="text-white font-semibold text-base mb-1">Camera unavailable</p>
        <p className="text-white/60 text-sm leading-relaxed max-w-xs">{error}</p>
      </div>
      <button
        type="button" onClick={onGallery}
        className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-palm-600 text-white text-sm font-medium hover:bg-palm-500 transition-colors"
      >
        <ImageIcon size={16} /> Upload from gallery instead
      </button>
    </div>
  );
}

// ─── Gemini Live error ─────────────────────────────────────
function LiveError({ error, onClose }) {
  return (
    <div className="absolute bottom-4 inset-x-4 z-20">
      <div className="rounded-2xl bg-red-900/80 backdrop-blur-md border border-red-600/40 px-4 py-3 flex items-start gap-3">
        <AlertTriangle size={18} className="text-red-400 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-white text-sm font-semibold">Live session error</p>
          <p className="text-red-200 text-xs mt-0.5 leading-relaxed">{error}</p>
        </div>
        <button type="button" onClick={onClose} className="text-white/60 hover:text-white transition-colors">
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
