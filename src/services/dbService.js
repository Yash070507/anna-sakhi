/**
 * dbService.js — Authenticated API client for all /api/db/* endpoints.
 *
 * Every call automatically attaches the Firebase ID token as a Bearer token
 * so the Python backend can verify the user's identity.
 */

/** Get the current user's fresh ID token from Firebase Auth */
async function getToken(user) {
  if (!user?.getIdToken) throw new Error('Not authenticated');
  return user.getIdToken();
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

async function apiFetch(path, options = {}, user) {
  const token = await getToken(user);
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || `API error ${res.status}`);
  }
  return res.json();
}

// ── Sessions ─────────────────────────────────────────────────

export async function getSessions(user) {
  return apiFetch('/api/db/sessions', {}, user);
}

export async function createSession(user, title = 'New conversation') {
  return apiFetch('/api/db/sessions', {
    method: 'POST',
    body: JSON.stringify({ title }),
  }, user);
}

export async function deleteSession(user, sessionId) {
  return apiFetch(`/api/db/sessions/${sessionId}`, { method: 'DELETE' }, user);
}

// ── Messages ──────────────────────────────────────────────────

export async function getMessages(user, sessionId) {
  return apiFetch(`/api/db/sessions/${sessionId}/messages`, {}, user);
}

export async function addMessage(user, sessionId, { role, content, imageUrl = null }) {
  return apiFetch(`/api/db/sessions/${sessionId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ role, content, imageUrl }),
  }, user);
}

// ── Recipes ───────────────────────────────────────────────────

export async function getRecipes(user) {
  return apiFetch('/api/db/recipes', {}, user);
}

export async function saveRecipe(user, recipe) {
  return apiFetch('/api/db/recipes', {
    method: 'POST',
    body: JSON.stringify(recipe),
  }, user);
}

export async function deleteRecipe(user, recipeId) {
  return apiFetch(`/api/db/recipes/${recipeId}`, { method: 'DELETE' }, user);
}

// ── Scans ─────────────────────────────────────────────────────

export async function saveScans(user, scan) {
  return apiFetch('/api/db/scans', {
    method: 'POST',
    body: JSON.stringify(scan),
  }, user);
}

export async function getScans(user) {
  return apiFetch('/api/db/scans', {}, user);
}

// ── Pantry ────────────────────────────────────────────────────

export async function getPantry(user) {
  return apiFetch('/api/db/pantry', {}, user);
}

export async function addPantryItem(user, item) {
  return apiFetch('/api/db/pantry', {
    method: 'POST',
    body: JSON.stringify(item),
  }, user);
}

export async function deletePantryItem(user, itemId) {
  return apiFetch(`/api/db/pantry/${itemId}`, { method: 'DELETE' }, user);
}
