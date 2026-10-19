export const C = {
  bg:       '#0B0F14',
  card:     '#141A22',
  card2:    '#1B232D',
  primary:  '#4ADE80',
  success:  '#86EFAC',
  secondary:'#38BDF8',
  warning:  '#FB923C',
  gold:     '#FACC15',
  text:     '#FFFFFF',
  text2:    '#9AA4B2',
  text3:    '#5B6573',
  border:   '#252E3A',
  overlay:  'rgba(11,15,20,0.95)',
};

// Meal slot for "now" — same buckets ScanScreen and AddFoodScreen use.
export function getSlot() {
  const h = new Date().getHours();
  if (h < 10) return 0; if (h < 14) return 1; if (h < 17) return 3; if (h < 21) return 2; return 3;
}
export const SLOT_LABELS = ['breakfast', 'lunch', 'dinner', 'snack'];   // i18n keys

export const R = { sm:10, md:14, lg:16, xl:20, full:999 };

export const SUGGESTION_FOODS = [
  { name:'Grilled Chicken Bowl',  protein:40, calories:520, effort:2, emoji:'🍗', image:'bowl', meal:true },
  { name:'Greek Yogurt + 2 Eggs', protein:29, calories:240, effort:1, emoji:'🥛', image:'yogurt' },
  { name:'Protein Shake',         protein:24, calories:130, effort:1, emoji:'🥤', image:'shake' },
  { name:'Tuna Sandwich',         protein:28, calories:360, effort:2, emoji:'🥪', image:'tunasand', meal:true },
  { name:'Chicken Breast (120g)', protein:31, calories:165, effort:2, emoji:'🍗', image:'chicken', meal:true },
  { name:'Cottage Cheese',        protein:14, calories: 80, effort:1, emoji:'🧀', image:'cottage' },
  { name:'2 Boiled Eggs',         protein:13, calories:140, effort:1, emoji:'🥚', image:'eggs' },
  { name:'Tuna Can',              protein:25, calories:110, effort:1, emoji:'🐟', image:'tuna' },
  { name:'Greek Yogurt (200g)',   protein:17, calories:200, effort:1, emoji:'🥛', image:'yogurt' },
  { name:'Whey Protein',          protein:25, calories:120, effort:1, emoji:'💪', image:'whey' },
  { name:'Turkey Breast',         protein:30, calories:135, effort:2, emoji:'🦃', image:'turkey', meal:true },
];

export function getSuggestions(remainingProtein, count=3, eatenNames=[]) {
  const h = new Date().getHours();
  const mealTime = (h >= 11 && h < 15) || (h >= 18 && h < 21);
  // Skip what was already eaten today so the next suggestion is something new.
  const pool = SUGGESTION_FOODS.filter(f => !eatenNames.includes(f.name));
  const scored = (pool.length >= count ? pool : SUGGESTION_FOODS).map(f => {
    let score = (f.protein / f.effort) - Math.abs(f.protein - remainingProtein/2)*0.1;
    if (mealTime && f.meal) score += 10;                 // real food at lunch/dinner
    if (f.protein > remainingProtein + 15) score -= 10;  // don't overshoot a small gap
    return { ...f, score };
  });
  scored.sort((a,b) => b.score - a.score);
  return scored.slice(0,count);
}

// Starter "Your foods": each has a household amount, so tapping one asks how much.
// protein/calories = the default amount (qty × per-unit).
export const QUICK_ADD = [
  { name:'Shake',   unit:'scoop',  qty:1, protein_per_unit:24, calories_per_unit:130, protein:24, calories:130, emoji:'🥤', image:'shake' },
  { name:'Yogurt',  unit:'cup',    qty:1, protein_per_unit:17, calories_per_unit:130, protein:17, calories:130, emoji:'🥛', image:'yogurt' },
  { name:'Eggs',    unit:'egg',    qty:2, protein_per_unit:6,  calories_per_unit:75,  protein:12, calories:150, emoji:'🥚', image:'eggs' },
  { name:'Chicken', unit:'breast', qty:1, protein_per_unit:45, calories_per_unit:250, protein:45, calories:250, emoji:'🍗', image:'chicken' },
  { name:'Tuna',    unit:'can',    qty:1, protein_per_unit:25, calories_per_unit:110, protein:25, calories:110, emoji:'🐟', image:'tuna' },
];

export const ACHIEVEMENTS = [
  { id:'first_scan', icon:'🌱', name:'First Step',      desc:'Logged your first meal',       days:0  },
  { id:'streak_3',   icon:'💪', name:'Protein Starter', desc:'Hit your goal 3 days in a row', days:3  },
  { id:'streak_7',   icon:'⭐', name:'Consistent',      desc:'Hit your goal 7 days in a row', days:7  },
  { id:'streak_14',  icon:'🏆', name:'Dedication',      desc:'Hit your goal 14 days in a row', days:14 },
  { id:'streak_30',  icon:'👑', name:'Protein Pro',     desc:'Hit your goal 30 days in a row', days:30 },
];
