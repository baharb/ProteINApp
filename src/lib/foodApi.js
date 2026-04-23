import { searchLocalDB } from '../data/nutritionDB';

const OFF_BASE = 'https://world.openfoodfacts.org';

function parseOFFProduct(p) {
  const n = p.nutriments;
  return {
    name:    p.product_name + (p.brands ? ` (${p.brands.split(',')[0].trim()})` : ''),
    cal:     Math.round(n['energy-kcal_100g'] || n['energy-kcal'] || 0),
    p:       Math.round(n.proteins_100g       || n.proteins       || 0),
    c:       Math.round(n.carbohydrates_100g  || n.carbohydrates  || 0),
    f:       Math.round(n.fat_100g            || n.fat            || 0),
    brand:   p.brands || '',
    barcode: p.code   || '',
    per:     '100g',
    source:  'openfoodfacts',
  };
}

// Try Open Food Facts first, fall back to local USDA DB
export async function searchFood(query, pageSize = 20) {
  if (!query || query.trim().length < 2) return [];

  // Always include local results
  const localResults = searchLocalDB(query).map(f => ({ ...f, per: '100g', source: 'local' }));

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000); // 5s timeout
    const url = `${OFF_BASE}/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=${pageSize}&fields=product_name,brands,nutriments,code&lc=en`;
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) throw new Error('OFF request failed');
    const text = await res.text();
    // Fix #6 — safe JSON parse
    let data;
    try { data = JSON.parse(text); } catch { throw new Error('Invalid JSON from OFF'); }
    const offResults = (data.products || [])
      .filter(p => p.product_name && p.nutriments && p.product_name.trim().length > 0)
      .map(parseOFFProduct)
      .filter(f => f.cal > 0 || f.p > 0);
    // Merge: local first (more reliable), then OFF results not already in local
    const localNames = new Set(localResults.map(f => f.name.toLowerCase()));
    const uniqueOFF = offResults.filter(f => !localNames.has(f.name.toLowerCase()));
    return [...localResults, ...uniqueOFF].slice(0, 25);
  } catch (e) {
    // OFF failed — return local results only
    console.log('OFF search failed, using local DB:', e.message);
    return localResults;
  }
}

export async function lookupBarcode(barcode) {
  try {
    const res  = await fetch(`${OFF_BASE}/api/v0/product/${barcode}.json`);
    const data = await res.json();
    if (data.status !== 1) return null;
    return parseOFFProduct(data.product);
  } catch (e) {
    return null;
  }
}
