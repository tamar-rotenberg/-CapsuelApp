// Mock SHEIN-style catalog. A real version would come from a product feed / affiliate API.
export const CATEGORIES = ['top', 'bottom', 'skirt', 'dress', 'outerwear', 'shoes', 'bag', 'accessory'];
export const STYLES = ['casual', 'street', 'chic', 'elegant', 'boho', 'sporty', 'office'];

// [name, category, colors[], styles[], price]
const RAW = [
  ['Basic Crew Neck Tee', 'top', ['white', 'black', 'grey', 'pink', 'sage'], ['casual', 'street'], 6.49],
  ['Ribbed Crop Tank', 'top', ['black', 'white', 'beige', 'lilac'], ['casual', 'street', 'sporty'], 4.99],
  ['Satin Cowl Neck Cami', 'top', ['black', 'cream', 'burgundy', 'sage'], ['chic', 'elegant'], 11.99],
  ['Oversized Poplin Shirt', 'top', ['white', 'blue', 'beige'], ['office', 'chic', 'casual'], 15.49],
  ['Puff Sleeve Blouse', 'top', ['white', 'pink', 'yellow'], ['chic', 'boho'], 13.99],
  ['Cable Knit Sweater', 'top', ['cream', 'brown', 'grey', 'olive'], ['casual', 'chic'], 18.99],
  ['Graphic Print Hoodie', 'top', ['grey', 'black', 'navy'], ['street', 'sporty', 'casual'], 16.99],
  ['Floral Peasant Top', 'top', ['cream', 'orange', 'blue'], ['boho', 'casual'], 12.49],
  ['Fitted Turtleneck', 'top', ['black', 'cream', 'brown', 'burgundy'], ['office', 'chic', 'elegant'], 10.99],

  ['High Waist Straight Jeans', 'bottom', ['denim', 'black', 'white'], ['casual', 'street'], 21.99],
  ['Wide Leg Tailored Trousers', 'bottom', ['black', 'beige', 'grey', 'navy'], ['office', 'chic', 'elegant'], 19.99],
  ['Cargo Parachute Pants', 'bottom', ['olive', 'black', 'beige'], ['street', 'casual'], 17.49],
  ['Biker Shorts', 'bottom', ['black', 'grey', 'navy'], ['sporty', 'street'], 6.99],
  ['Linen Drawstring Pants', 'bottom', ['white', 'beige', 'sage'], ['boho', 'casual'], 15.99],
  ['Denim Mom Shorts', 'bottom', ['denim', 'white'], ['casual', 'street'], 13.49],
  ['Flare Leggings', 'bottom', ['black', 'brown', 'grey'], ['sporty', 'casual'], 9.99],

  ['Satin Midi Slip Skirt', 'skirt', ['cream', 'black', 'sage', 'burgundy', 'lilac'], ['chic', 'elegant'], 14.99],
  ['Pleated Tennis Mini Skirt', 'skirt', ['white', 'black', 'grey', 'pink'], ['street', 'sporty', 'casual'], 9.49],
  ['Tiered Boho Maxi Skirt', 'skirt', ['beige', 'orange', 'brown'], ['boho'], 16.99],
  ['Denim Mini Skirt', 'skirt', ['denim', 'black'], ['casual', 'street'], 12.99],
  ['Pencil Skirt', 'skirt', ['black', 'navy', 'grey'], ['office', 'elegant'], 13.49],

  ['Floral Wrap Midi Dress', 'dress', ['blue', 'pink', 'yellow', 'green'], ['boho', 'casual', 'chic'], 22.99],
  ['Little Black Bodycon Dress', 'dress', ['black', 'red', 'burgundy'], ['elegant', 'chic'], 17.99],
  ['Square Neck Linen Sundress', 'dress', ['white', 'sage', 'yellow', 'lilac'], ['casual', 'boho'], 19.49],
  ['Knit Sweater Dress', 'dress', ['grey', 'cream', 'brown'], ['casual', 'chic'], 21.49],
  ['Satin Slip Maxi Dress', 'dress', ['green', 'burgundy', 'navy', 'lilac'], ['elegant'], 24.99],
  ['Shirt Dress with Belt', 'dress', ['beige', 'white', 'blue'], ['office', 'chic'], 23.49],

  ['Oversized Denim Jacket', 'outerwear', ['denim', 'black'], ['casual', 'street'], 27.99],
  ['Faux Leather Biker Jacket', 'outerwear', ['black', 'brown'], ['street', 'chic'], 32.99],
  ['Longline Blazer', 'outerwear', ['black', 'beige', 'grey', 'navy'], ['office', 'chic'], 29.99],
  ['Cropped Cardigan', 'outerwear', ['cream', 'pink', 'sage', 'lilac'], ['casual', 'boho', 'chic'], 14.99],
  ['Trench Coat', 'outerwear', ['beige', 'black'], ['chic', 'office', 'elegant'], 39.99],
  ['Zip Up Windbreaker', 'outerwear', ['black', 'navy', 'green'], ['sporty', 'street'], 19.99],

  ['Chunky Platform Sneakers', 'shoes', ['white', 'black'], ['street', 'casual', 'sporty'], 24.99],
  ['Pointed Toe Kitten Heels', 'shoes', ['black', 'beige', 'red'], ['office', 'elegant', 'chic'], 21.99],
  ['Strappy Block Heel Sandals', 'shoes', ['beige', 'black', 'white'], ['elegant', 'chic', 'boho'], 19.99],
  ['Western Ankle Boots', 'shoes', ['brown', 'black', 'beige'], ['boho', 'street', 'casual'], 29.99],
  ['Ballet Flats', 'shoes', ['black', 'beige', 'burgundy'], ['chic', 'office', 'casual'], 14.99],
  ['Running Sneakers', 'shoes', ['grey', 'white', 'black'], ['sporty', 'casual'], 22.49],

  ['Shoulder Baguette Bag', 'bag', ['black', 'cream', 'brown', 'pink'], ['chic', 'elegant', 'street'], 11.99],
  ['Canvas Tote Bag', 'bag', ['beige', 'black', 'white'], ['casual', 'boho', 'office'], 8.99],
  ['Mini Crossbody Bag', 'bag', ['black', 'white', 'red', 'lilac'], ['street', 'casual', 'chic'], 9.99],
  ['Woven Straw Bag', 'bag', ['beige', 'brown'], ['boho', 'casual'], 12.99],
  ['Structured Top Handle Bag', 'bag', ['black', 'brown', 'beige', 'burgundy'], ['office', 'elegant'], 17.99],
  ['Nylon Belt Bag', 'bag', ['black', 'grey', 'olive'], ['sporty', 'street'], 7.99],

  ['Gold Layered Necklace', 'accessory', ['yellow'], ['chic', 'boho', 'elegant'], 5.99],
  ['Silver Hoop Earrings', 'accessory', ['grey'], ['street', 'casual', 'chic'], 3.99],
  ['Silk Hair Scarf', 'accessory', ['burgundy', 'blue', 'pink'], ['chic', 'boho'], 4.49],
  ['Baseball Cap', 'accessory', ['black', 'beige', 'navy'], ['sporty', 'street', 'casual'], 5.49],
  ['Leather Belt', 'accessory', ['black', 'brown'], ['office', 'casual', 'chic'], 6.99],
];

export function sheinSearchUrl(query) {
  return `https://us.shein.com/pdsearch/${encodeURIComponent(query)}/`;
}

// Cut / silhouette tags, used for body-shape rules (see profile.js).
const CUTS = {
  'Basic Crew Neck Tee': ['relaxed'],
  'Ribbed Crop Tank': ['cropped', 'fitted'],
  'Satin Cowl Neck Cami': ['cowl', 'flowy'],
  'Oversized Poplin Shirt': ['oversized'],
  'Puff Sleeve Blouse': ['puff-sleeve'],
  'Cable Knit Sweater': ['chunky'],
  'Graphic Print Hoodie': ['oversized'],
  'Floral Peasant Top': ['flowy', 'v-neck'],
  'Fitted Turtleneck': ['fitted', 'high-neck'],
  'High Waist Straight Jeans': ['high-waist', 'straight'],
  'Wide Leg Tailored Trousers': ['high-waist', 'wide-leg'],
  'Cargo Parachute Pants': ['baggy'],
  'Biker Shorts': ['fitted', 'short'],
  'Linen Drawstring Pants': ['wide-leg', 'flowy'],
  'Denim Mom Shorts': ['high-waist', 'short'],
  'Flare Leggings': ['flare', 'fitted'],
  'Satin Midi Slip Skirt': ['bias-cut', 'midi'],
  'Pleated Tennis Mini Skirt': ['a-line', 'mini'],
  'Tiered Boho Maxi Skirt': ['tiered', 'maxi'],
  'Denim Mini Skirt': ['mini', 'straight'],
  'Pencil Skirt': ['pencil', 'fitted'],
  'Floral Wrap Midi Dress': ['wrap', 'midi', 'v-neck'],
  'Little Black Bodycon Dress': ['bodycon', 'fitted'],
  'Square Neck Linen Sundress': ['a-line', 'square-neck'],
  'Knit Sweater Dress': ['straight'],
  'Satin Slip Maxi Dress': ['bias-cut', 'maxi'],
  'Shirt Dress with Belt': ['belted', 'a-line'],
  'Oversized Denim Jacket': ['oversized'],
  'Faux Leather Biker Jacket': ['cropped', 'structured'],
  'Longline Blazer': ['longline', 'structured'],
  'Cropped Cardigan': ['cropped'],
  'Trench Coat': ['belted', 'longline'],
  'Zip Up Windbreaker': ['oversized'],
};

// Each color variant becomes its own product, like a SHEIN listing per color.
export const CATALOG = RAW.flatMap(([name, category, colors, styles, price], i) =>
  colors.map((color, j) => ({
    id: `p${i}-${j}`,
    name,
    title: titleFor(name, color),
    category,
    color,
    styles,
    cuts: CUTS[name] || [],
    price: +(price + j * 0.5).toFixed(2),
    url: sheinSearchUrl(titleFor(name, color)),
  }))
);

function titleFor(name, color) {
  if (name.toLowerCase().includes(color) || /gold|silver/i.test(name)) return name;
  return `${cap(color)} ${name}`;
}

function cap(s) { return s[0].toUpperCase() + s.slice(1); }
