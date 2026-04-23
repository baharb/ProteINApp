// Built-in USDA-based nutrition database — fallback when Open Food Facts fails
// All values per 100g
export const NUTRITION_DB = [
  // Proteins
  { name: 'Chicken Breast (cooked)', cal: 165, p: 31, c: 0, f: 4, category: 'protein' },
  { name: 'Chicken Thigh (cooked)', cal: 209, p: 26, c: 0, f: 11, category: 'protein' },
  { name: 'Beef (lean mince, cooked)', cal: 215, p: 26, c: 0, f: 12, category: 'protein' },
  { name: 'Beef Steak (grilled)', cal: 271, p: 29, c: 0, f: 17, category: 'protein' },
  { name: 'Salmon (cooked)', cal: 208, p: 20, c: 0, f: 13, category: 'protein' },
  { name: 'Tuna (canned in water)', cal: 110, p: 25, c: 0, f: 1, category: 'protein' },
  { name: 'Cod (cooked)', cal: 105, p: 23, c: 0, f: 1, category: 'protein' },
  { name: 'Shrimp (cooked)', cal: 99, p: 24, c: 0, f: 1, category: 'protein' },
  { name: 'Turkey Breast (cooked)', cal: 135, p: 30, c: 0, f: 1, category: 'protein' },
  { name: 'Egg (whole)', cal: 155, p: 13, c: 1, f: 11, category: 'protein' },
  { name: 'Egg White', cal: 52, p: 11, c: 1, f: 0, category: 'protein' },
  { name: 'Tofu (firm)', cal: 76, p: 8, c: 2, f: 4, category: 'protein' },
  { name: 'Tempeh', cal: 193, p: 19, c: 9, f: 11, category: 'protein' },
  { name: 'Edamame', cal: 121, p: 11, c: 9, f: 5, category: 'protein' },
  { name: 'Lentils (cooked)', cal: 116, p: 9, c: 20, f: 0, category: 'protein' },
  { name: 'Chickpeas (cooked)', cal: 164, p: 9, c: 27, f: 3, category: 'protein' },
  { name: 'Black Beans (cooked)', cal: 132, p: 9, c: 24, f: 1, category: 'protein' },
  { name: 'Whey Protein Powder', cal: 400, p: 80, c: 10, f: 5, category: 'protein' },
  // Dairy
  { name: 'Greek Yogurt (0% fat)', cal: 59, p: 10, c: 4, f: 0, category: 'dairy' },
  { name: 'Greek Yogurt (full fat)', cal: 97, p: 9, c: 4, f: 5, category: 'dairy' },
  { name: 'Cottage Cheese (low fat)', cal: 72, p: 12, c: 3, f: 1, category: 'dairy' },
  { name: 'Milk (whole)', cal: 61, p: 3, c: 5, f: 3, category: 'dairy' },
  { name: 'Milk (skimmed)', cal: 35, p: 4, c: 5, f: 0, category: 'dairy' },
  { name: 'Cheddar Cheese', cal: 402, p: 25, c: 1, f: 33, category: 'dairy' },
  { name: 'Mozzarella', cal: 280, p: 28, c: 2, f: 17, category: 'dairy' },
  { name: 'Parmesan', cal: 431, p: 38, c: 4, f: 29, category: 'dairy' },
  // Grains
  { name: 'White Rice (cooked)', cal: 130, p: 3, c: 28, f: 0, category: 'grain' },
  { name: 'Brown Rice (cooked)', cal: 123, p: 3, c: 26, f: 1, category: 'grain' },
  { name: 'Basmati Rice (cooked)', cal: 121, p: 4, c: 25, f: 0, category: 'grain' },
  { name: 'Oats (dry)', cal: 389, p: 17, c: 66, f: 7, category: 'grain' },
  { name: 'Oatmeal (cooked)', cal: 71, p: 2, c: 12, f: 1, category: 'grain' },
  { name: 'Pasta (dry)', cal: 371, p: 13, c: 75, f: 2, category: 'grain' },
  { name: 'Pasta (cooked)', cal: 158, p: 6, c: 31, f: 1, category: 'grain' },
  { name: 'Whole Wheat Bread', cal: 247, p: 13, c: 41, f: 4, category: 'grain' },
  { name: 'White Bread', cal: 265, p: 9, c: 49, f: 3, category: 'grain' },
  { name: 'Quinoa (cooked)', cal: 120, p: 4, c: 21, f: 2, category: 'grain' },
  { name: 'Tortilla (wheat)', cal: 306, p: 8, c: 51, f: 7, category: 'grain' },
  // Vegetables
  { name: 'Broccoli', cal: 34, p: 3, c: 7, f: 0, category: 'veg' },
  { name: 'Spinach', cal: 23, p: 3, c: 4, f: 0, category: 'veg' },
  { name: 'Sweet Potato', cal: 86, p: 2, c: 20, f: 0, category: 'veg' },
  { name: 'White Potato', cal: 77, p: 2, c: 17, f: 0, category: 'veg' },
  { name: 'Carrot', cal: 41, p: 1, c: 10, f: 0, category: 'veg' },
  { name: 'Bell Pepper', cal: 31, p: 1, c: 6, f: 0, category: 'veg' },
  { name: 'Cucumber', cal: 15, p: 1, c: 4, f: 0, category: 'veg' },
  { name: 'Tomato', cal: 18, p: 1, c: 4, f: 0, category: 'veg' },
  { name: 'Lettuce (romaine)', cal: 17, p: 1, c: 3, f: 0, category: 'veg' },
  { name: 'Mushrooms', cal: 22, p: 3, c: 3, f: 0, category: 'veg' },
  { name: 'Onion', cal: 40, p: 1, c: 9, f: 0, category: 'veg' },
  { name: 'Corn', cal: 86, p: 3, c: 19, f: 1, category: 'veg' },
  { name: 'Peas', cal: 81, p: 5, c: 14, f: 0, category: 'veg' },
  // Fruits
  { name: 'Banana', cal: 89, p: 1, c: 23, f: 0, category: 'fruit' },
  { name: 'Apple', cal: 52, p: 0, c: 14, f: 0, category: 'fruit' },
  { name: 'Orange', cal: 47, p: 1, c: 12, f: 0, category: 'fruit' },
  { name: 'Blueberries', cal: 57, p: 1, c: 14, f: 0, category: 'fruit' },
  { name: 'Strawberries', cal: 32, p: 1, c: 8, f: 0, category: 'fruit' },
  { name: 'Mango', cal: 60, p: 1, c: 15, f: 0, category: 'fruit' },
  { name: 'Avocado', cal: 160, p: 2, c: 9, f: 15, category: 'fruit' },
  // Fats & Nuts
  { name: 'Olive Oil', cal: 884, p: 0, c: 0, f: 100, category: 'fat' },
  { name: 'Butter', cal: 717, p: 1, c: 0, f: 81, category: 'fat' },
  { name: 'Almonds', cal: 579, p: 21, c: 22, f: 50, category: 'fat' },
  { name: 'Peanuts', cal: 567, p: 26, c: 16, f: 49, category: 'fat' },
  { name: 'Peanut Butter', cal: 588, p: 25, c: 20, f: 50, category: 'fat' },
  { name: 'Walnuts', cal: 654, p: 15, c: 14, f: 65, category: 'fat' },
  { name: 'Cashews', cal: 553, p: 18, c: 30, f: 44, category: 'fat' },
  // Drinks
  { name: 'Black Tea (brewed)', cal: 1, p: 0, c: 0, f: 0, category: 'drink' },
  { name: 'Green Tea (brewed)', cal: 1, p: 0, c: 0, f: 0, category: 'drink' },
  { name: 'Coffee (black)', cal: 2, p: 0, c: 0, f: 0, category: 'drink' },
  { name: 'Orange Juice', cal: 45, p: 1, c: 10, f: 0, category: 'drink' },
  { name: 'Almond Milk (unsweetened)', cal: 15, p: 1, c: 1, f: 1, category: 'drink' },
  { name: 'Oat Milk', cal: 45, p: 1, c: 7, f: 2, category: 'drink' },
  // Snacks & Other
  { name: 'Dark Chocolate (70%)', cal: 598, p: 8, c: 46, f: 43, category: 'snack' },
  { name: 'Hummus', cal: 166, p: 8, c: 14, f: 10, category: 'snack' },
  { name: 'Rice Cakes', cal: 387, p: 8, c: 81, f: 3, category: 'snack' },
];

export function searchLocalDB(query) {
  if (!query || query.length < 1) return [];
  const q = query.toLowerCase().trim();
  return NUTRITION_DB.filter(f =>
    f.name.toLowerCase().includes(q)
  ).slice(0, 20);
}
