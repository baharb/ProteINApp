// Food pictures bundled with the app: the food cut out of Unsplash photos
// (https://unsplash.com/license — free for commercial use, no attribution
// required) on a transparent background, so they sit cleanly on the app's
// plain dark tile. Credits are kept for an About/Credits screen later.

export const FOOD_IMAGES = {
  chicken:  { source: require('../../assets/food/chicken.webp'),  credit: 'Unsplash', page: 'https://unsplash.com/photos/9lubH598KsY' },
  bowl:     { source: require('../../assets/food/bowl.webp'),     credit: 'James Frewin',       page: 'https://unsplash.com/photos/CzD0EHabuzE' },
  yogurt:   { source: require('../../assets/food/yogurt.webp'),   credit: 'Unsplash', page: 'https://unsplash.com/photos/LymX5D2sSWM' },
  eggs:     { source: require('../../assets/food/eggs.webp'),     credit: 'Unsplash', page: 'https://unsplash.com/photos/ZnhfGjMeGJM' },
  shake:    { source: require('../../assets/food/shake.webp'),    credit: 'Unsplash', page: 'https://unsplash.com/photos/aVuX_kXlJGo' },
  tunasand: { source: require('../../assets/food/tunasand.webp'), credit: 'Unsplash', page: 'https://unsplash.com/photos/IZ0LRt1khgM' },
  cottage:  { source: require('../../assets/food/cottage.webp'),  credit: 'Unsplash', page: 'https://unsplash.com/photos/EtR0Pj0txhs' },
  tuna:     { source: require('../../assets/food/tuna.webp'),     credit: 'Grooveland Designs', page: 'https://unsplash.com/photos/8kkTIumkHxU' },
  whey:     { source: require('../../assets/food/whey.webp'),     credit: 'Alex Saks',          page: 'https://unsplash.com/photos/R23MqZKCBcM' },
  turkey:   { source: require('../../assets/food/turkey.webp'),   credit: '大胡子',              page: 'https://unsplash.com/photos/m7qqkpIlDjs' },
};

// Picture for a food the user typed or scanned, guessed from its name
// (English or Farsi). Order matters: "tuna sandwich" before "tuna".
const GUESSES = [
  ['tunasand', /tuna.*sandwich|sandwich.*tuna|ساندویچ.*تن/i],
  ['whey',     /whey|protein powder|پودر پروتئین|پروتئین[\s‌]*وی/i],
  ['shake',    /shake|smoothie|شیک|اسموتی/i],
  ['cottage',  /cottage|کاتیج/i],
  ['yogurt',   /yog(h)?urt|skyr|ماست/i],
  ['eggs',     /\beggs?\b|omelet|تخم[\s‌]*مرغ|املت|نیمرو/i],
  ['tuna',     /tuna|تن[\s‌]*ماهی/i],
  ['turkey',   /turkey|بوقلمون/i],
  ['bowl',     /bowl|rice|برنج|چلو/i],
  ['chicken',  /chicken|مرغ|جوجه/i],
];

export function guessFoodImage(name) {
  if (!name) return null;
  const hit = GUESSES.find(([, re]) => re.test(name));
  return hit ? hit[0] : null;
}
