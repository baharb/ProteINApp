import { SERVER_URL, fetchWithTimeout, errorKey } from './config';

// "کوبیده با برنج" → [{ name, emoji, unit, qty, qty_given, protein_per_unit, calories_per_unit }]
// format 'grams' → [{ name, amount_g, per_100g:{calories,protein,carbs,fat} }] (same as a scan's ingredients)
export async function estimateMeal(text, lang = 'en', format) {
  let res;
  try {
    res = await fetchWithTimeout(`${SERVER_URL}/estimate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, lang, ...(format && { format }) }),
    }, 45000);
  } catch {
    throw new Error('cantReach');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.error) throw new Error(errorKey(res.status, data) || 'estimateFailed');
  return data.items || [];
}

// Portion choices for one item. Countable things (skewers, eggs…) → 1/2/3;
// dishes (plate, bowl, serving…) → ½ / 1 / 1½.
const DISH_UNITS = ['plate', 'bowl', 'serving', 'cup', 'glass', 'breast', 'can'];
export function portionOptions(item) {
  const q = item.qty || 1;
  if (DISH_UNITS.includes(item.unit)) return [0.5, 1, 1.5];
  const base = Math.max(1, Math.round(q) - 1);
  return [base, base + 1, base + 2];
}
