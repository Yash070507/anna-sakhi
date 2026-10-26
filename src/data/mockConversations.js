// ─── Mock Conversation History ──────────────────────────────────────────────
// Grouped for sidebar display

export const MOCK_CONVERSATIONS = [
  // Today
  {
    id: 'conv-001',
    title: 'Malvani Fish Curry Recipe',
    preview: 'Give me a traditional Malvani fish curry recipe',
    group: 'Today',
    timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 min ago
    active: true,
  },
  {
    id: 'conv-002',
    title: 'Quick Breakfast Ideas',
    preview: 'What can I make for breakfast in 10 minutes?',
    group: 'Today',
    timestamp: new Date(Date.now() - 1000 * 60 * 90), // 90 min ago
    active: false,
  },
  // Yesterday
  {
    id: 'conv-003',
    title: 'Coconut Chutney Variants',
    preview: 'Show me different coconut chutney recipes',
    group: 'Yesterday',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 26),
    active: false,
  },
  {
    id: 'conv-004',
    title: 'Healthy Meal Prep Week',
    preview: 'Help me plan healthy meals for the week',
    group: 'Yesterday',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 30),
    active: false,
  },
  {
    id: 'conv-005',
    title: 'Calorie Count — Rice Bowl',
    preview: 'How many calories in a rice bowl with dal?',
    group: 'Yesterday',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 34),
    active: false,
  },
  // Previous 7 Days
  {
    id: 'conv-006',
    title: 'Monsoon Comfort Food',
    preview: 'Suggest Konkan-style comfort food for rainy days',
    group: 'Previous 7 Days',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 72),
    active: false,
  },
  {
    id: 'conv-007',
    title: 'Substitute for Coconut Milk',
    preview: "I don't have coconut milk, what can I use?",
    group: 'Previous 7 Days',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 96),
    active: false,
  },
  {
    id: 'conv-008',
    title: 'Solkadhi Preparation',
    preview: 'How to make authentic Solkadhi at home?',
    group: 'Previous 7 Days',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 120),
    active: false,
  },
  {
    id: 'conv-009',
    title: 'Protein-Rich Vegetarian Meals',
    preview: 'High protein vegetarian meals for gym days',
    group: 'Previous 7 Days',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 144),
    active: false,
  },
];

export const CONVERSATION_GROUPS = ['Today', 'Yesterday', 'Previous 7 Days'];
