/**
 * geminiVision.js — Gemini API client (server-proxied)
 *
 * All calls go through the Express backend (/api/*).
 * The Gemini API key lives only in server/.env — never in the browser bundle.
 *
 * Falls back to mock responses when the server is unreachable (dev without server).
 */

// ── Mock fallbacks for dev without a server ────────────────
const MOCK_VISION = `🌴 *Anna Sakhi (demo mode)*

I can see some lovely ingredients here! To get real AI analysis, start the Python backend:

\`\`\`
python app.py
\`\`\`

Or from the project root (backend + Vite together):
\`\`\`
npm run py:dev:full
\`\`\`

Once the server is running with your Gemini API key in \`server/.env\`, I'll tell you exactly what I see and suggest authentic Konkan recipes! 🥥🌶️`;

const MOCK_CHAT = `🌴 *Anna Sakhi (demo mode)*

The Python backend isn't running yet. Start it with:

\`\`\`
npm run py:dev:full
\`\`\`

Then add your Gemini API key to \`server/.env\` and I'll be ready to help with all your Konkan cooking questions! 🍛`;

// ── Config ────────────────────────────────────────────────
// In production (Firebase Hosting), VITE_API_BASE_URL points to the Vercel backend.
// In development, it's empty so the Vite proxy forwards /api/* to localhost:4000.
const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

// ── Helpers ────────────────────────────────────────────────
async function post(endpoint, body) {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `Server error ${res.status}`);
  }
  return res.json();
}

// ── Public API ─────────────────────────────────────────────

/**
 * Analyse an image for ingredients, quantities, and recipe suggestions.
 * @param {string} base64Data  – raw base64 (no data URL prefix)
 * @param {string} mimeType    – e.g. 'image/jpeg'
 * @param {string} [userText]  – optional caption from the user
 * @returns {Promise<string|null>}
 */
export async function analyseImage(base64Data, mimeType = 'image/jpeg', userText = '') {
  try {
    const data = await post('/api/vision', { base64: base64Data, mimeType, userText });
    return data.text ?? null;
  } catch (err) {
    if (isNetworkError(err)) {
      console.warn('[Anna Sakhi] Backend not reachable — using mock vision response');
      return MOCK_VISION;
    }
    console.error('[Anna Sakhi] /api/vision error:', err.message);
    return null;
  }
}

/**
 * Answer a plain text cooking / recipe question as Anna Sakhi.
 * @param {string} userMessage
 * @param {Array}  history  – [{role: 'user'|'assistant', content: string}]
 * @returns {Promise<string|null>}
 */
export async function analyseText(userMessage, history = [], userMemory = []) {
  try {
    const data = await post('/api/chat', { message: userMessage, history, userMemory });
    return data.text ?? null;
  } catch (err) {
    if (isNetworkError(err)) {
      console.warn('[Anna Sakhi] Backend not reachable — using mock chat response');
      return MOCK_CHAT;
    }
    console.error('[Anna Sakhi] /api/chat error:', err.message);
    return null;
  }
}

/** True if the server is reachable and has an API key configured */
export async function isConfigured() {
  try {
    const res = await fetch(`${API_BASE}/health`);
    if (!res.ok) return false;
    const data = await res.json();
    return data.configured === true;
  } catch {
    return false;
  }
}

// ── Internal ───────────────────────────────────────────────
function isNetworkError(err) {
  return (
    err instanceof TypeError ||           // fetch failed (server down)
    err?.message?.includes('Failed to fetch') ||
    err?.message?.includes('NetworkError') ||
    err?.message?.includes('ECONNREFUSED')
  );
}
