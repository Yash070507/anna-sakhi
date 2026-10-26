import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);  // true until Firebase resolves initial auth state
  const [error, setError]     = useState(null);

  // ── Listen for auth state changes ──────────────────────────
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        // Normalise to the shape the rest of the app expects
        const initials = (firebaseUser.displayName || firebaseUser.email || 'U')
          .split(' ')
          .map((n) => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2);
        setUser({
          uid:         firebaseUser.uid,
          displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
          email:       firebaseUser.email,
          photoURL:    firebaseUser.photoURL,
          initials,
          // helper to get a fresh ID token for API calls
          getIdToken:  () => firebaseUser.getIdToken(),
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  // ── Email / Password sign-in ────────────────────────────────
  const loginWithEmail = useCallback(async (email, password) => {
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return { success: true };
    } catch (err) {
      const msg = friendlyError(err.code);
      setError(msg);
      return { success: false, error: msg };
    }
  }, []);

  // ── Email / Password sign-up ────────────────────────────────
  const signupWithEmail = useCallback(async (name, email, password) => {
    setError(null);
    try {
      const { user: fbUser } = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(fbUser, { displayName: name });
      return { success: true };
    } catch (err) {
      const msg = friendlyError(err.code);
      setError(msg);
      return { success: false, error: msg };
    }
  }, []);

  // ── Google Sign-In ──────────────────────────────────────────
  const loginWithGoogle = useCallback(async () => {
    setError(null);
    try {
      await signInWithPopup(auth, googleProvider);
      return { success: true };
    } catch (err) {
      if (err.code === 'auth/popup-closed-by-user') return { success: false };
      const msg = friendlyError(err.code);
      setError(msg);
      return { success: false, error: msg };
    }
  }, []);

  // ── Forgot password ─────────────────────────────────────────
  const sendPasswordReset = useCallback(async (email) => {
    setError(null);
    try {
      await sendPasswordResetEmail(auth, email);
      return { success: true };
    } catch (err) {
      const msg = friendlyError(err.code);
      setError(msg);
      return { success: false, error: msg };
    }
  }, []);

  // ── Sign-out ────────────────────────────────────────────────
  const logout = useCallback(async () => {
    await signOut(auth);
    setUser(null);
    setError(null);
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        loginWithEmail,
        signupWithEmail,
        loginWithGoogle,
        sendPasswordReset,
        logout,
        clearError,
        isAuthenticated: !!user,
      }}
    >
      {/* Show nothing until Firebase resolves the initial auth state */}
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

// ── Map Firebase error codes to friendly messages ────────────
function friendlyError(code) {
  const map = {
    'auth/invalid-email':            'Please enter a valid email address.',
    'auth/user-disabled':            'This account has been disabled.',
    'auth/user-not-found':           'No account found with this email.',
    'auth/wrong-password':           'Incorrect password. Please try again.',
    'auth/invalid-credential':       'Incorrect email or password.',
    'auth/email-already-in-use':     'An account with this email already exists.',
    'auth/weak-password':            'Password must be at least 6 characters.',
    'auth/too-many-requests':        'Too many attempts. Please wait a moment and try again.',
    'auth/network-request-failed':   'Network error. Check your connection.',
    'auth/popup-blocked':            'Popup was blocked. Please allow popups for this site.',
    'auth/cancelled-popup-request':  'Sign-in cancelled.',
    'auth/unauthorized-domain':      'This domain is not authorised. Check Firebase Console → Auth → Settings.',
  };
  return map[code] || 'Something went wrong. Please try again.';
}
