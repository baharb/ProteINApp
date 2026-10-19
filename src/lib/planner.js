import { SUGGESTION_FOODS } from '../data/theme';

// ── Autopilot: pick the next meal ─────────────────────────────────────────
// Splits what's left of today's protein over the meals still to come, then
// prefers the user's own foods (especially ones they usually eat at this
// time of day) over the generic list.

export function nextMealMoment(date = new Date()) {
  const h = date.getHours();
  if (h < 10) return { label:'breakfast',    slot:0, mealsLeft:4 };   // labels are i18n keys
  if (h < 14) return { label:'lunch',        slot:1, mealsLeft:3 };
  if (h < 17) return { label:'snack',        slot:3, mealsLeft:2 };
  if (h < 21) return { label:'dinner',       slot:2, mealsLeft:1 };
  return            { label:'eveningSnack', slot:3, mealsLeft:1 };
}

export function planNextMeals({ remaining, myFoods = {}, eatenToday = [], count = 6 }) {
  if (remaining <= 0) return [];
  const moment = nextMealMoment();
  const target = remaining / moment.mealsLeft;
  const isMealTime = moment.label === 'lunch' || moment.label === 'dinner';

  const mine = Object.values(myFoods)
    .filter(f => f.protein >= 5)
    .map(f => ({ ...f, mine:true }));
  const mineNames = new Set(mine.map(f => f.name));
  const generic = SUGGESTION_FOODS.filter(f => !mineNames.has(f.name)).map(f => ({ ...f, mine:false }));

  const scored = [...mine, ...generic]
    .filter(f => !eatenToday.includes(f.name))
    .map(f => {
      let score = -Math.abs(f.protein - target);                 // closest to the per-meal target
      if (f.mine) score += 10 + Math.min(f.count || 0, 5) * 2;    // your own foods first
      if (f.mine && f.slots?.[moment.slot] > 0) score += 8;        // ...especially at this time of day
      if (isMealTime && f.meal) score += 6;                        // real food at lunch/dinner
      if (f.protein > remaining + 15) score -= 12;                 // don't overshoot a small gap
      return { ...f, score };
    })
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, count);
}
