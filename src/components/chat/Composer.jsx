import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Paperclip, Camera, Mic, MicOff, ArrowUp, X, ImageIcon } from 'lucide-react';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import { LiveCameraAssistant } from './LiveCameraAssistant';

let attachId = 0;

export function Composer({ onSend, disabled = false }) {
  const [text, setText] = useState('');
  const [attachments, setAttachments] = useState([]); // [{ id, name, dataUrl }]
  const [isRecording, setIsRecording] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 200) + 'px';
  }, [text]);

  // ── Read files into data URLs ──────────────────────────────
  const addFiles = useCallback((files) => {
    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        setAttachments((prev) => [
          ...prev,
          { id: ++attachId, name: file.name, dataUrl: e.target.result },
        ]);
      };
      reader.readAsDataURL(file);
    });
  }, []);

  // ── Camera capture callback ────────────────────────────────
  const handleCameraCapture = useCallback(({ dataUrl, name }) => {
    setAttachments((prev) => [
      ...prev,
      { id: ++attachId, name: name || `camera-${Date.now()}.jpg`, dataUrl },
    ]);
  }, []);

  const removeAttachment = useCallback((id) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  }, []);

  // ── Send ──────────────────────────────────────────────────
  const canSend = (text.trim().length > 0 || attachments.length > 0) && !disabled;

  const handleSend = useCallback(() => {
    if (!canSend) return;
    onSend({ text: text.trim(), attachments });
    setText('');
    setAttachments([]);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  }, [canSend, text, attachments, onSend]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ── Paste from clipboard ──────────────────────────────────
  const handlePaste = useCallback((e) => {
    const items = Array.from(e.clipboardData?.items || []);
    const imageItems = items.filter((item) => item.type.startsWith('image/'));
    if (imageItems.length === 0) return;
    e.preventDefault();
    imageItems.forEach((item) => {
      const file = item.getAsFile();
      if (file) addFiles([file]);
    });
  }, [addFiles]);

  return (
    <>
      {/* ── Live Camera Modal ── */}
      <LiveCameraAssistant
        isOpen={cameraOpen}
        onClose={() => setCameraOpen(false)}
        onCapture={handleCameraCapture}
      />

      <div className="px-4 md:px-8 pb-5 pt-3 border-t border-[var(--border-subtle)] bg-[var(--bg-primary)]">
        <div className="max-w-3xl mx-auto">

          {/* ── Image Preview Strip ── */}
          <AnimatePresence>
            {attachments.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                animate={{ opacity: 1, height: 'auto', marginBottom: 8 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                transition={{ duration: 0.2 }}
                className="flex gap-2 flex-wrap overflow-hidden"
              >
                {attachments.map((att) => (
                  <motion.div
                    key={att.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.18 }}
                    className="relative group"
                  >
                    <img
                      src={att.dataUrl}
                      alt={att.name}
                      className="w-16 h-16 object-cover rounded-xl border border-[var(--border-medium)] shadow-soft"
                    />
                    <button
                      type="button"
                      onClick={() => removeAttachment(att.id)}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[var(--bg-primary)] border border-[var(--border-medium)] shadow-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-150 text-[var(--text-secondary)] hover:text-red-500"
                      aria-label={`Remove ${att.name}`}
                    >
                      <X size={11} strokeWidth={2.5} />
                    </button>
                  </motion.div>
                ))}

                {/* Add more */}
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-16 h-16 rounded-xl border-2 border-dashed border-[var(--border-medium)] flex flex-col items-center justify-center gap-1 text-[var(--text-muted)] hover:border-palm-400 hover:text-palm-500 transition-colors duration-150"
                  aria-label="Add more images"
                >
                  <ImageIcon size={16} />
                  <span className="text-[9px] font-medium">Add</span>
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Hidden file input (gallery) */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }}
            aria-label="Attach images from gallery"
          />

          {/* ── Composer box ── */}
          <div className={clsx(
            'flex items-end gap-2 rounded-2xl border bg-[var(--bg-elevated)] shadow-soft px-3 py-2.5 transition-all duration-200',
            'focus-within:border-palm-400 focus-within:shadow-card',
            disabled ? 'border-[var(--border-subtle)] opacity-70' : 'border-[var(--border-medium)]'
          )}>
            {/* ── Left Actions ── */}
            <div className="flex items-center gap-1 flex-shrink-0 pb-0.5">
              {/* Gallery / attach */}
              <ActionButton
                icon={Paperclip}
                label="Attach image from gallery"
                onClick={() => fileInputRef.current?.click()}
                title="Attach an image from gallery"
              />
              {/* Live camera */}
              <ActionButton
                icon={Camera}
                label="Open live camera"
                onClick={() => setCameraOpen(true)}
                title="Open live camera assistant"
              />
            </div>

            {/* ── Textarea ── */}
            <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              placeholder="Ask me about recipes, or share an image of ingredients…"
              rows={1}
              disabled={disabled}
              className={clsx(
                'composer-textarea flex-1 bg-transparent text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)]',
                'focus:outline-none resize-none py-1',
                disabled && 'cursor-not-allowed'
              )}
              aria-label="Message input"
            />

            {/* ── Right Actions ── */}
            <div className="flex items-center gap-1.5 flex-shrink-0 pb-0.5">
              {/* Mic button */}
              <button
                type="button"
                onClick={() => setIsRecording((v) => !v)}
                className={clsx(
                  'p-2 rounded-xl transition-all duration-200',
                  isRecording
                    ? 'bg-red-500 text-white animate-pulse-soft shadow-md'
                    : 'btn-ghost text-[var(--text-muted)]'
                )}
                title={isRecording ? 'Stop recording' : 'Voice input'}
                aria-label={isRecording ? 'Stop recording' : 'Start voice input'}
              >
                {isRecording ? <MicOff size={17} /> : <Mic size={17} />}
              </button>

              {/* Send button */}
              <AnimatePresence>
                <motion.button
                  type="button"
                  onClick={handleSend}
                  disabled={!canSend}
                  className={clsx(
                    'p-2 rounded-xl transition-all duration-200',
                    canSend
                      ? 'btn-green shadow-sm'
                      : 'bg-[var(--border-subtle)] text-[var(--text-muted)] cursor-not-allowed'
                  )}
                  whileTap={canSend ? { scale: 0.9 } : {}}
                  title="Send message (Enter)"
                  aria-label="Send message"
                >
                  <ArrowUp size={17} />
                </motion.button>
              </AnimatePresence>
            </div>
          </div>

          {/* Helper text */}
          <p className="text-center text-[10px] text-[var(--text-muted)] mt-2">
            Enter to send · Shift+Enter for new line · 📎 gallery · 📷 live camera · paste images
            {isRecording && (
              <span className="ml-2 text-red-500 font-semibold animate-pulse">
                🔴 Recording…
              </span>
            )}
          </p>
        </div>
      </div>
    </>
  );
}

function ActionButton({ icon: Icon, label, onClick, title }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="p-2 rounded-xl btn-ghost text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
      title={title}
      aria-label={label}
    >
      <Icon size={17} />
    </button>
  );
}
