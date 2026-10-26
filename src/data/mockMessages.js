// ─── Message Types ──────────────────────────────────────────────────────────
// type: 'text' | 'recipe'

export const MOCK_MESSAGES = [
  {
    id: 'msg-001',
    role: 'user',
    type: 'text',
    content: 'Give me a traditional Malvani fish curry recipe',
    timestamp: new Date(Date.now() - 1000 * 60 * 28),
  },
  {
    id: 'msg-002',
    role: 'assistant',
    type: 'text',
    content: "Ah, excellent choice! 🌴 Malvani fish curry is one of the crown jewels of Konkan coastal cuisine — bold, coconut-rich, and wonderfully aromatic. I've put together a traditional recipe that uses the authentic Malvani masala. Let me share the full recipe below:",
    timestamp: new Date(Date.now() - 1000 * 60 * 27),
  },
  {
    id: 'msg-003',
    role: 'assistant',
    type: 'recipe',
    timestamp: new Date(Date.now() - 1000 * 60 * 27),
    recipe: {
      title: 'Malvani Fish Curry',
      emoji: '🐟',
      cuisine: 'Konkan Coastal',
      description: 'A rich, coconut-based fish curry with bold Malvani spices, tangy kokum, and the warmth of traditional coastal spice blends.',
      cookTime: '35 mins',
      prepTime: '15 mins',
      servings: 4,
      difficulty: 'Medium',
      ingredients: [
        { id: 'ing-01', amount: '500g', item: 'Surmai (King Fish) / Pomfret, cleaned & cut' },
        { id: 'ing-02', amount: '1 cup', item: 'Freshly grated coconut' },
        { id: 'ing-03', amount: '3 tbsp', item: 'Malvani masala powder' },
        { id: 'ing-04', amount: '2 tbsp', item: 'Red chilli powder (Kashmiri for color)' },
        { id: 'ing-05', amount: '1 tsp', item: 'Turmeric powder' },
        { id: 'ing-06', amount: '4–5 pieces', item: 'Kokum (dried, soaked in warm water)' },
        { id: 'ing-07', amount: '2 medium', item: 'Onions, finely sliced' },
        { id: 'ing-08', amount: '1 medium', item: 'Tomato, chopped' },
        { id: 'ing-09', amount: '8–10', item: 'Garlic cloves' },
        { id: 'ing-10', amount: '1 inch', item: 'Ginger piece' },
        { id: 'ing-11', amount: '2 tbsp', item: 'Coconut oil (or neutral oil)' },
        { id: 'ing-12', amount: 'To taste', item: 'Salt' },
        { id: 'ing-13', amount: '1 cup', item: 'Water (as needed for consistency)' },
        { id: 'ing-14', amount: '2 sprigs', item: 'Fresh curry leaves' },
      ],
      instructions: [
        {
          step: 1,
          title: 'Marinate the Fish',
          detail: 'Clean the fish pieces and marinate with ½ tsp turmeric, 1 tsp red chilli powder, and salt. Set aside for 15 minutes.',
        },
        {
          step: 2,
          title: 'Make the Coconut Paste',
          detail: 'Grind grated coconut, garlic, ginger, Malvani masala, remaining red chilli powder, and ½ tsp turmeric with a little water into a smooth, thick paste.',
        },
        {
          step: 3,
          title: 'Sauté the Base',
          detail: 'Heat coconut oil in a heavy-bottomed pan. Add curry leaves, then sliced onions and sauté until golden. Add chopped tomatoes and cook until soft.',
        },
        {
          step: 4,
          title: 'Add the Masala Paste',
          detail: 'Add the ground coconut paste to the pan. Stir well and cook on medium heat for 5–7 minutes until the paste darkens slightly and oil begins to separate.',
        },
        {
          step: 5,
          title: 'Build the Curry',
          detail: 'Add water to reach desired consistency (it should be a thick, flowing gravy). Add soaked kokum pieces along with the soaking water. Bring to a gentle boil.',
        },
        {
          step: 6,
          title: 'Cook the Fish',
          detail: 'Gently slide in the marinated fish pieces. Cook on low-medium heat for 8–10 minutes without stirring too much — just gently tilt the pan. Fish should be cooked through.',
        },
        {
          step: 7,
          title: 'Rest & Serve',
          detail: 'Let the curry rest for 5 minutes off heat. Serve hot with steamed red rice, Konkani rice, or bhakri. Pairs beautifully with sol kadhi on the side.',
        },
      ],
      nutrition: {
        calories: 320,
        protein: '28g',
        carbs: '14g',
        fat: '18g',
        fiber: '4g',
      },
      tips: [
        'Use fresh surmai or pomfret for best results — frozen fish can make the curry watery.',
        'Kokum gives the authentic Konkan tang — do not substitute with tamarind in this recipe.',
        'Let the curry sit for 30 minutes before serving for deeper, richer flavors.',
      ],
    },
  },
  {
    id: 'msg-004',
    role: 'user',
    type: 'text',
    content: 'Can I use tamarind instead of kokum?',
    timestamp: new Date(Date.now() - 1000 * 60 * 22),
  },
  {
    id: 'msg-005',
    role: 'assistant',
    type: 'text',
    content: "You can, but I'd gently advise against it for a true Malvani experience. 😊\n\n**Kokum** gives a subtler, fruitier tang with a beautiful deep pink hue that is characteristic of authentic Konkan fish curries. **Tamarind**, while tangy, has a stronger, earthier sourness that can overpower the delicate coconut-spice balance.\n\nIf you must substitute:\n- Use **¼ tsp tamarind paste** (very sparingly — start small and taste)\n- Or try **raw mango pieces** (aamsol) during mango season for a lovely fruity tartness\n- **Dried amchur** (mango powder) at the end also works in a pinch\n\nBest bet though — kokum is available in most Indian grocery stores or online. It's worth having in your pantry as a staple Konkan ingredient! 🌸",
    timestamp: new Date(Date.now() - 1000 * 60 * 21),
  },
];

// ─── Suggested prompts shown on welcome screen ──────────────────────────────
export const SUGGESTED_PROMPTS = [
  { id: 'sp-1', icon: '🍽️', label: 'Give me a recipe', query: 'Give me a traditional Konkan recipe I can make tonight' },
  { id: 'sp-2', icon: '🤔', label: 'What can I cook?', query: 'I have onions, tomatoes, coconut, and rice — what can I cook?' },
  { id: 'sp-3', icon: '🥗', label: 'Healthy meal ideas', query: 'Suggest some healthy and nutritious Konkan-style meals' },
  { id: 'sp-4', icon: '⚡', label: 'Quick dinner', query: 'I need a quick dinner idea that takes under 30 minutes' },
  { id: 'sp-5', icon: '🧺', label: 'Use my ingredients', query: 'Help me figure out what to cook with ingredients I have at home' },
];
