/**
 * memoryService.js — Cross-session persistent tastes and preferences
 *
 * Saves user tastes, go-to foods, and dietary preferences to localStorage
 * so Anna Sakhi remembers them across every conversation turn and new chats.
 */

export function getStoredMemory(user) {
  try {
    const key = `anna_sakhi_memory_${user?.uid || 'guest'}`;
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveStoredMemory(user, memory) {
  try {
    const key = `anna_sakhi_memory_${user?.uid || 'guest'}`;
    localStorage.setItem(key, JSON.stringify(memory));
    window.dispatchEvent(new CustomEvent('anna_sakhi_memory_updated', { detail: memory }));
  } catch (err) {
    console.warn('[memoryService] Failed to save memory:', err);
  }
}

export function extractPreferences(text) {
  if (!text) return null;
  const trimmed = text.trim();
  const lower = trimmed.toLowerCase();

  // Pattern 1: "my go to food is X", "my go-to food is X", "my go to is X"
  const goToMatch = lower.match(/my\s+(?:go\s*[-]?\s*to(?:\s+food|\s+dish|\s+meal|\s+snack)?)\s+(?:is|are)\s+([^.,!?;]+)/i);
  if (goToMatch) {
    const dish = goToMatch[1].trim();
    if (dish.length > 1 && dish.length < 50) {
      return `Go-to food: ${dish}`;
    }
  }

  // Pattern 2: "my favorite food is X", "my fav food is X"
  const favMatch = lower.match(/my\s+(?:favou?r?ite(?:\s+food|\s+dish|\s+meal)?)\s+(?:is|are)\s+([^.,!?;]+)/i);
  if (favMatch) {
    const dish = favMatch[1].trim();
    if (dish.length > 1 && dish.length < 50) {
      return `Favorite food: ${dish}`;
    }
  }

  // Pattern 3: "i love eating X", "i really like eating X"
  const loveMatch = lower.match(/i\s+(?:love\s+eating|really\s+like\s+eating)\s+([^.,!?;]+)/i);
  if (loveMatch) {
    const dish = loveMatch[1].trim();
    if (dish.length > 1 && dish.length < 50) {
      return `Loved food: ${dish}`;
    }
  }

  // Pattern 4: Dietary preferences
  if (/\b(?:i am|i'm|im)\s+vegetarian\b/i.test(lower)) return 'Diet: Vegetarian';
  if (/\b(?:i am|i'm|im)\s+vegan\b/i.test(lower)) return 'Diet: Vegan';
  if (/\b(?:i am|i'm|im)\s+jain\b/i.test(lower)) return 'Diet: Jain (no onion, garlic, or root vegetables)';
  if (/\b(?:i am|i'm|im)\s+eggetarian\b/i.test(lower)) return 'Diet: Eggetarian';

  // Pattern 5: Spice preferences
  if (/\b(?:i like|i prefer)\s+(?:very\s+)?spicy\s+food\b/i.test(lower)) return 'Spice preference: Spicy';
  if (/\b(?:i like|i prefer)\s+mild\s+food\b/i.test(lower)) return 'Spice preference: Mild';

  return null;
}
