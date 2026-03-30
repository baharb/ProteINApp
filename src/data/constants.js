export const colors = {
  bg: '#0a0a0f', bg2: '#111118', bg3: '#1a1a24',
  card: '#16161f', card2: '#1e1e2a',
  border: 'rgba(255,255,255,0.07)',
  accent: '#7effa0', accent3: '#00d4ff',
  orange: '#ff8c42', pink: '#ff6b9d',
  text: '#f0f0f8', text2: '#8888a8', text3: '#555570',
};
export const radius = { sm: 12, md: 16, lg: 20 };

// Unit helpers — always store metric internally
export function displayWeight(kg, unit) {
  if (!kg) return '—';
  if (unit === 'lbs') return (kg * 2.20462).toFixed(1) + ' lbs';
  return kg.toFixed(1) + ' kg';
}
export function displayHeight(cm, unit) {
  if (!cm) return '—';
  if (unit === 'in') return (cm / 2.54).toFixed(1) + ' in';
  if (unit === 'ft') {
    const totalIn = cm / 2.54;
    return Math.floor(totalIn / 12) + "'" + Math.round(totalIn % 12) + '"';
  }
  return Math.round(cm) + ' cm';
}
export function inputToKg(val, unit) {
  const v = parseFloat(val) || 0;
  return unit === 'lbs' ? v / 2.20462 : v;
}
export function inputToCm(val, unit) {
  const v = parseFloat(val) || 0;
  if (unit === 'in') return v * 2.54;
  if (unit === 'ft') return v * 30.48;
  return v;
}

export const TIPS = [
  'Aim for 20–40g protein per meal for maximum muscle protein synthesis.',
  'Drinking water before meals helps control calorie intake.',
  'Lean meats, eggs, and dairy are the most bioavailable protein sources.',
  'Eating protein at breakfast sets you up for better food choices all day.',
  'Protein intake matters even on rest days — that\'s when muscle is built.',
  'Greek yogurt has nearly 3x more protein than regular yogurt.',
  'Carbs fuel your workouts and spare protein for muscle building.',
];

export const SCAN_RESULTS = [
  { name: 'Chicken Rice Bowl', sub: 'Grilled chicken · steamed rice · broccoli', cal: 520, p: 42, c: 58, f: 12 },
  { name: 'Salmon & Quinoa', sub: 'Baked salmon · quinoa · green salad', cal: 480, p: 38, c: 42, f: 18 },
  { name: 'Protein Oats Bowl', sub: 'Oatmeal · banana · protein powder', cal: 390, p: 30, c: 56, f: 8 },
  { name: 'Caesar Salad + Chicken', sub: 'Romaine · grilled chicken · dressing', cal: 420, p: 35, c: 18, f: 22 },
  { name: 'Beef Burger & Fries', sub: 'Beef patty · brioche bun · fries', cal: 890, p: 38, c: 92, f: 42 },
  { name: 'Egg Omelette & Toast', sub: '3 eggs · cheese · whole grain toast', cal: 360, p: 26, c: 30, f: 14 },
];

export const LAZY_ESTIMATES = {
  'chicken sandwich': { name: 'Chicken Sandwich', cal: 420, p: 28, c: 38, f: 12 },
  pizza:    { name: 'Pizza (2 slices)',     cal: 560, p: 24, c: 70, f: 20 },
  burger:   { name: 'Beef Burger',          cal: 650, p: 35, c: 52, f: 28 },
  salad:    { name: 'Mixed Salad',          cal: 220, p: 15, c: 18, f: 10 },
  pasta:    { name: 'Pasta Bolognese',      cal: 520, p: 28, c: 64, f: 14 },
  oats:     { name: 'Oatmeal',             cal: 310, p: 12, c: 54, f:  6 },
  eggs:     { name: 'Scrambled Eggs',       cal: 220, p: 18, c:  2, f: 16 },
  rice:     { name: 'Rice & Chicken',       cal: 480, p: 36, c: 58, f:  8 },
  fish:     { name: 'Grilled Fish',         cal: 280, p: 34, c:  0, f: 12 },
  smoothie: { name: 'Protein Smoothie',     cal: 380, p: 32, c: 42, f:  8 },
  yogurt:   { name: 'Greek Yogurt Bowl',    cal: 280, p: 22, c: 30, f:  4 },
  sandwich: { name: 'Mixed Sandwich',       cal: 380, p: 22, c: 42, f: 12 },
  steak:    { name: 'Beef Steak (200g)',    cal: 440, p: 48, c:  0, f: 24 },
  soup:     { name: 'Vegetable Soup',       cal: 180, p:  8, c: 24, f:  5 },
  wrap:     { name: 'Chicken Wrap',         cal: 380, p: 30, c: 38, f: 12 },
};

export const QUICK_PROTEIN = [
  { g:  8, cal: 152, name: 'Glass of milk (250ml)', emoji: '🥛' },
  { g: 13, cal: 140, name: '2 whole eggs',           emoji: '🥚' },
  { g: 17, cal:  90, name: 'Greek yogurt (150g)',    emoji: '🫙' },
  { g: 24, cal: 120, name: 'Protein shake',          emoji: '🧃' },
  { g: 31, cal: 165, name: 'Chicken breast (100g)',  emoji: '🍗' },
  { g: 25, cal: 110, name: 'Tuna can (100g)',        emoji: '🐟' },
];

export const MEAL_OPTIONS = [
  { name: 'Protein Smoothie', emoji: '🥤', desc: 'Whey + banana + oats + milk', cal: 420, p: 35, c: 45, f: 8 },
  { name: 'Chicken Wrap',     emoji: '🌯', desc: 'Grilled chicken, lettuce, tortilla', cal: 380, p: 32, c: 36, f: 10 },
  { name: 'Tuna Sandwich',    emoji: '🥪', desc: 'Tuna, whole wheat bread, lettuce',   cal: 340, p: 28, c: 38, f:  8 },
  { name: 'Egg Omelette',     emoji: '🍳', desc: '3 eggs, cheese, whole grain toast',  cal: 360, p: 26, c: 30, f: 14 },
];

export const GOAL_LABELS = {
  lose:    '🔥 Lose Fat',
  muscle:  '💪 Build Muscle',
  healthy: '🌿 Stay Healthy',
};

export const ACTIVITIES = [
  { key: 'sedentary', label: 'Sedentary',    desc: 'Little or no exercise' },
  { key: 'light',     label: 'Light',        desc: '1–3 days/week' },
  { key: 'moderate',  label: 'Moderate',     desc: '3–5 days/week' },
  { key: 'active',    label: 'Very Active',  desc: '6–7 days/week' },
];

export const GOALS_LIST = [
  { key: 'lose',    icon: '🔥', label: 'Lose Fat',     desc: 'Caloric deficit, high protein' },
  { key: 'muscle',  icon: '💪', label: 'Build Muscle', desc: 'Slight surplus, max protein' },
  { key: 'healthy', icon: '🌿', label: 'Stay Healthy', desc: 'Balanced long-term approach' },
];
