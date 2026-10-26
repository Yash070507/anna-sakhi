import React, { useCallback, useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, RefreshCw, ImageIcon, AlertTriangle } from 'lucide-react';
import { clsx } from 'clsx';
import { useCameraStream } from '../../hooks/useCameraStream';

let captureSeq = 0;

/**
 * CameraAssistant — full-screen live camera overlay.
 *
 * Props:
 *   isOpen     – boolean
 *   onClose()  – called when user closes
 *   onCapture({ dataUrl, name }) – called with snapshot data
 */
export function CameraAssistant({ isOpen, onClose, onCapture }) {
  const { videoRef, isReady, error, facingMode, flip, capture, stop } = useCameraStream();
  const [flash, setFlash] = useState(false);
  const fileInputRef = useRef(null);

  // Stop stream when modal closes
  useEffect(() => {
    if (!isOpen) stop();
  }, [isOpen, stop]);

  // Escape key
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') handleClose(); };
    if (isOpen) window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleClose = useCallback(() => {
    stop();
    onClose();
  }, [stop, onClose]);

  const handleCapture = useCallback(() => {
    const snapshot = capture();
    if (!snapshot) return;

    // Flash animation
    setFlash(true);
    setTimeout(() => setFlash(false), 250);

    // Small delay to let flash finish before closing
    setTimeout(() => {
      stop();
      onCapture({ ...snapshot, id: ++captureSeq });
      onClose();
    }, 180);
  }, [capture, stop, onCapture, onClose]);

  // Fallback: gallery upload
  const handleGalleryFallback = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      onCapture({ dataUrl: ev.target.result, name: file.name, id: ++captureSeq });
      onClose();
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  }, [onCapture, onClose]);

  const portal = document.getElementById('root');

  return ReactDOM.createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="camera-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[100] flex flex-col bg-black"
          aria-modal="true"
          role="dialog"
          aria-label="Live camera assistant"
        >
          {/* ── Camera feed ── */}
          <div className="relative flex-1 overflow-hidden">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={clsx(
                'absolute inset-0 w-full h-full object-cover',
                facingMode === 'user' && 'scale-x-[-1]' // mirror front cam
              )}
              aria-label="Camera viewfinder"
            />

            {/* Loading shimmer */}
            {!isReady && !error && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/80">
                <div className="w-10 h-10 rounded-full border-2 border-palm-400 border-t-transparent animate-spin" />
                <p className="text-white/70 text-sm">Starting camera…</p>
              </div>
            )}

            {/* Permission / device error */}
            {error && <ErrorState error={error} onGallery={() => fileInputRef.current?.click()} onClose={handleClose} />}

            {/* Camera flash overlay */}
            <AnimatePresence>
              {flash && (
                <motion.div
                  key="flash"
                  initial={{ opacity: 0.9 }}
                  animate={{ opacity: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="absolute inset-0 bg-white pointer-events-none"
                />
              )}
            </AnimatePresence>

            {/* ── Top HUD ── */}
            {!error && (
              <div className="absolute top-0 inset-x-0 flex items-center justify-between px-4 pt-safe-top pt-6 pb-4 bg-gradient-to-b from-black/60 to-transparent">
                {/* Anna Sakhi label */}
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-palm-600 to-sea-600 flex items-center justify-center shadow-lg">
                    <span className="text-base" role="img" aria-label="Anna Sakhi">🌴</span>
                  </div>
                  <div>
                    <p className="text-white text-sm font-semibold leading-none">Anna Sakhi</p>
                    <p className="text-white/60 text-[11px] mt-0.5">Point at ingredients or a dish</p>
                  </div>
                </div>

                {/* Close */}
                <button
                  type="button"
                  onClick={handleClose}
                  className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/60 transition-colors"
                  aria-label="Close camera"
                >
                  <X size={18} />
                </button>
              </div>
            )}

            {/* ── Viewfinder corners ── */}
            {isReady && !error && <ViewfinderCorners />}

            {/* ── Scanning hint ── */}
            {isReady && !error && (
              <div className="absolute bottom-32 inset-x-0 flex flex-col items-center gap-1 pointer-events-none">
                <ScanLine />
                <p className="text-white/60 text-xs mt-2 font-medium tracking-wide">
                  Tap capture to analyse
                </p>
              </div>
            )}
          </div>

          {/* ── Bottom controls ── */}
          {!error && (
            <div className="bg-black flex items-center justify-between px-10 py-6 pb-safe-bottom">
              {/* Flip camera */}
              <button
                type="button"
                onClick={flip}
                className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/20 transition-colors"
                aria-label="Flip camera"
                title="Flip camera"
              >
                <RefreshCw size={20} />
              </button>

              {/* Capture */}
              <button
                type="button"
                onClick={handleCapture}
                disabled={!isReady}
                className={clsx(
                  'relative w-20 h-20 rounded-full transition-all duration-200',
                  'flex items-center justify-center',
                  isReady ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'
                )}
                aria-label="Capture photo"
                title="Capture photo"
              >
                {/* Outer pulsing ring */}
                {isReady && (
                  <motion.div
                    className="absolute inset-0 rounded-full border-2 border-white/60"
                    animate={{ scale: [1, 1.12, 1], opacity: [0.6, 0.2, 0.6] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  />
                )}
                {/* Inner button */}
                <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-2xl">
                  <div className="w-12 h-12 rounded-full bg-palm-600" />
                </div>
              </button>

              {/* Gallery fallback */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/20 transition-colors"
                aria-label="Upload from gallery"
                title="Upload from gallery"
              >
                <ImageIcon size={20} />
              </button>
            </div>
          )}

          {/* Hidden gallery input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleGalleryFallback}
            aria-label="Upload image from gallery"
          />
        </motion.div>
      )}
    </AnimatePresence>,
    portal
  );
}

// ─── Viewfinder corner brackets ───────────────────────────
function ViewfinderCorners() {
  const cornerClass = 'absolute w-8 h-8 border-white/70';
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <motion.div
        className="relative w-56 h-56 md:w-72 md:h-72"
        animate={{ opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
      >
        {/* Top-left */}
        <div className={clsx(cornerClass, 'top-0 left-0 border-t-2 border-l-2 rounded-tl-lg')} />
        {/* Top-right */}
        <div className={clsx(cornerClass, 'top-0 right-0 border-t-2 border-r-2 rounded-tr-lg')} />
        {/* Bottom-left */}
        <div className={clsx(cornerClass, 'bottom-0 left-0 border-b-2 border-l-2 rounded-bl-lg')} />
        {/* Bottom-right */}
        <div className={clsx(cornerClass, 'bottom-0 right-0 border-b-2 border-r-2 rounded-br-lg')} />
      </motion.div>
    </div>
  );
}

// ─── Animated scan line ────────────────────────────────────
function ScanLine() {
  return (
    <div className="relative w-40 h-px overflow-visible">
      <motion.div
        className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-palm-400 to-transparent"
        animate={{ scaleX: [0.3, 1, 0.3], opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  );
}

// ─── Permission error state ────────────────────────────────
function ErrorState({ error, onGallery, onClose }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 bg-black/90 px-8 text-center">
      {/* Close button */}
      <button
        type="button"
        onClick={onClose}
        className="absolute top-6 right-4 w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
        aria-label="Close camera"
      >
        <X size={18} />
      </button>

      <div className="w-16 h-16 rounded-2xl bg-terracotta-900/50 border border-terracotta-600/40 flex items-center justify-center">
        <AlertTriangle size={28} className="text-terracotta-400" />
      </div>
      <div>
        <p className="text-white font-semibold text-base mb-1">Camera unavailable</p>
        <p className="text-white/60 text-sm leading-relaxed">{error}</p>
      </div>
      <button
        type="button"
        onClick={onGallery}
        className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-palm-600 text-white text-sm font-medium hover:bg-palm-500 transition-colors"
      >
        <ImageIcon size={16} />
        Upload from gallery instead
      </button>
    </div>
  );
}
