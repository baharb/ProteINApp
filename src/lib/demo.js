// Demo mode for store screenshots: only in a web browser with ?demo=1 in the
// URL. It fills the app with a sample day (no account, nothing sent to the
// server). Never active in the phone apps.
import { Platform } from 'react-native';
import { localDateKey } from './dates';

const search = Platform.OS === 'web' && typeof window !== 'undefined' ? window.location.search : '';
export const DEMO = /[?&]demo=1\b/.test(search);
export const DEMO_SCREEN = (search.match(/[?&]screen=(\w+)/) || [])[1] || '';

export const DEMO_SESSION = { user: { id: 'demo', email: 'sara@example.com' } };
export const DEMO_PROFILE = { display_name: 'Sara', goal_calories: 1900, goal_protein: 110, goal_carbs: 190, goal_fat: 55, goals: ['muscle'], age: 32, weight_kg: 62, height_cm: 168 };
export const DEMO_GOALS = { calories: 1900, protein: 110, carbs: 190, fat: 55 };

export const DEMO_MEALS = [
  { id: 'd1', name: 'Greek yogurt + berries', cal: 210, p: 20, c: 24, f: 3, slot: 0, emoji: '🥣' },
  { id: 'd2', name: '2 eggs and toast',       cal: 300, p: 15, c: 20, f: 14, slot: 0, emoji: '🍳' },
  { id: 'd3', name: 'Grilled chicken bowl',   cal: 520, p: 41, c: 48, f: 14, slot: 1, emoji: '🍗' },
];
export const DEMO_TODAY = DEMO_MEALS.reduce(
  (a, m) => ({ ...a, calories: a.calories + m.cal, protein: a.protein + m.p, carbs: a.carbs + m.c, fat: a.fat + m.f }),
  { calories: 0, protein: 0, carbs: 0, fat: 0, meals: DEMO_MEALS },
);

const now = Date.now();
export const DEMO_MY_FOODS = {
  'Chicken':                { name: 'Chicken', unit: 'breast', qty: 1, protein_per_unit: 45, calories_per_unit: 250, protein: 45, calories: 250, image: 'chicken', count: 9, last: now - 1e6 },
  'Greek yogurt + berries': { name: 'Greek yogurt + berries', protein: 20, calories: 210, image: 'yogurt', count: 8, last: now - 2e6 },
  'Shake':                  { name: 'Shake', unit: 'scoop', qty: 1, protein_per_unit: 24, calories_per_unit: 130, protein: 24, calories: 130, image: 'shake', count: 7, last: now - 3e6 },
  'Eggs':                   { name: 'Eggs', unit: 'egg', qty: 2, protein_per_unit: 6, calories_per_unit: 75, protein: 12, calories: 150, image: 'eggs', count: 6, last: now - 4e6 },
  'Tuna':                   { name: 'Tuna', unit: 'can', qty: 1, protein_per_unit: 25, calories_per_unit: 110, protein: 25, calories: 110, image: 'tuna', count: 4, last: now - 5e6 },
  'Cottage Cheese (150g)':  { name: 'Cottage Cheese (150g)', protein: 17, calories: 150, image: 'cottage', count: 3, last: now - 6e6 },
};

// Protein per past day (most recent first) for the Progress chart.
const PAST = [112, 96, 118, 104, 87, 115, 108, 99, 121, 92, 110, 101, 117];
export function demoHistory() {
  const prot = {}, cnt = {};
  PAST.forEach((p, i) => {
    const d = new Date(); d.setDate(d.getDate() - (i + 1));
    prot[localDateKey(d)] = p; cnt[localDateKey(d)] = 3 + (i % 2);
  });
  return { prot, cnt };
}
export function demoGoalDays() {
  const days = [];
  PAST.forEach((p, i) => { if (p >= DEMO_GOALS.protein || i < 5) { const d = new Date(); d.setDate(d.getDate() - (i + 1)); days.push(localDateKey(d)); } });
  return days;
}

export const DEMO_COACH = [
  { role: 'user', content: 'What should I eat now? I have 34g left.' },
  { role: 'assistant', content: '**Easy ways to close 34g:**\n- 1 can of tuna on 2 rice cakes (~27g)\n- or 1 cup Greek yogurt + a scoop of whey (~40g)\n- or 2 eggs + 100g cottage cheese (~29g)\n\nPick the tuna if you want it done in 2 minutes. 💪' },
];

export const DEMO_SCAN = {
  meal_name: 'Grilled chicken with rice and greens',
  confidence: 'high',
  ingredients: [
    { name: 'Grilled chicken breast', amount_g: 130, per_100g: { calories: 165, protein: 31, carbs: 0, fat: 4 } },
    { name: 'Yellow rice',            amount_g: 150, per_100g: { calories: 130, protein: 3,  carbs: 28, fat: 1 } },
    { name: 'Sautéed kale',           amount_g: 60,  per_100g: { calories: 50,  protein: 3,  carbs: 9,  fat: 1 } },
  ],
};
