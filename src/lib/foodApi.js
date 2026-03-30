const OFF_BASE = 'https://world.openfoodfacts.org';

/**
 * Search Open Food Facts for foods by name.
 * Returns array of { name, cal, p, c, f, brand, barcode }
 */
export async function searchFood(query, pageSize = 20) {
  try {
    const url = `${OFF_BASE}/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=${pageSize}&fields=product_name,brands,nutriments,code`;
    const res  = await fetch(url);
    const data = await res.json();

    return (data.products || [])
      .filter(p => p.product_name && p.nutriments)
      .map(p => {
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
        };
      })
      .filter(f => f.cal > 0 || f.p > 0); // filter out empty entries
  } catch (e) {
    console.error('Open Food Facts error:', e);
    return [];
  }
}

/**
 * Look up a product by barcode (EAN/UPC)
 */
export async function lookupBarcode(barcode) {
  try {
    const res  = await fetch(`${OFF_BASE}/api/v0/product/${barcode}.json`);
    const data = await res.json();
    if (data.status !== 1) return null;
    const p = data.product;
    const n = p.nutriments;
    return {
      name:    p.product_name || 'Unknown Product',
      cal:     Math.round(n['energy-kcal_100g'] || 0),
      p:       Math.round(n.proteins_100g       || 0),
      c:       Math.round(n.carbohydrates_100g  || 0),
      f:       Math.round(n.fat_100g            || 0),
      brand:   p.brands || '',
      barcode: p.code,
      per:     '100g',
    };
  } catch (e) {
    console.error('Barcode lookup error:', e);
    return null;
  }
}
