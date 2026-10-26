import { useRef, useState, useCallback, useEffect } from 'react';

/**
 * useCameraStream — manages getUserMedia lifecycle
 *
 * Returns:
 *   videoRef   – attach to <video> element
 *   isReady    – stream is live and video is playing
 *   error      – string if permission denied / not supported
 *   facingMode – 'environment' | 'user'
 *   flip()     – toggle front/rear camera
 *   capture()  – snapshot → { dataUrl, name }
 *   stop()     – release all tracks
 */
export function useCameraStream() {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState(null);
  const [facingMode, setFacingMode] = useState('environment');

  const stop = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setIsReady(false);
  }, []);

  const start = useCallback(async (facing = 'environment') => {
    stop(); // clean up any previous stream
    setError(null);
    setIsReady(false);

    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Camera is not supported in this browser.');
      return;
    }

    try {
      const constraints = {
        video: {
          facingMode: { ideal: facing },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play().then(() => setIsReady(true)).catch(() => {
            setError('Could not start video playback.');
          });
        };
      }
    } catch (err) {
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError('Camera access was denied. Please allow camera access in your browser settings.');
      } else if (err.name === 'NotFoundError') {
        setError('No camera found on this device.');
      } else {
        setError(`Camera error: ${err.message}`);
      }
    }
  }, [stop]);

  // Start on mount with current facingMode
  useEffect(() => {
    start(facingMode);
    return () => stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const flip = useCallback(() => {
    const next = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(next);
    start(next);
  }, [facingMode, start]);

  const capture = useCallback(() => {
    const video = videoRef.current;
    if (!video || !isReady) return null;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');

    // Flip horizontally for front-facing so it matches expectation
    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    const name = `camera-capture-${Date.now()}.jpg`;
    return { dataUrl, name };
  }, [isReady, facingMode]);

  return { videoRef, isReady, error, facingMode, flip, capture, stop };
}
