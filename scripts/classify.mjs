// Turn a raw product (title, category text, color text) into the app's tags.
// Keyword rules tuned to SHEIN-style titles, e.g. "SHEIN EZwear Solid Ribbed Knit Crop Tank Top".

const has = (text, words) => words.some((w) => new RegExp(`\\b${w}\\b`, 'i').test(text));

// Checked in order: the first match wins ("Shirt Dress" is a dress, "Belt Bag" is a bag).
const CATEGORY_RULES = [
  ['skip', ['set', '2pcs', '3pcs', 'two piece', 'co-ord', 'jumpsuit', 'romper', 'swimsuit', 'bikini', 'lingerie', 'bra', 'panty', 'panties', 'pajama', 'sleepwear', 'men', "men's", 'boys', 'girls', 'kids', 'toddler', 'baby', 'maternity', 'phone case', 'pillow', 'curtain', 'mug']],
  ['dress', ['dress', 'gown']],
  ['skirt', ['skirt', 'skort']],
  ['bag', ['bag', 'tote', 'crossbody', 'backpack', 'clutch', 'purse', 'handbag', 'satchel']],
  ['outerwear', ['jacket', 'coat', 'blazer', 'cardigan', 'trench', 'puffer', 'windbreaker', 'shacket', 'parka', 'gilet', 'vest jacket']],
  ['shoes', ['sneakers', 'sneaker', 'heels', 'heel', 'sandals', 'sandal', 'boots', 'boot', 'flats', 'loafers', 'mules', 'pumps', 'slippers', 'shoes', 'trainers']],
  ['bottom', ['jeans', 'pants', 'trousers', 'shorts', 'leggings', 'joggers', 'sweatpants', 'culottes']],
  ['top', ['tee', 't-shirt', 'tshirt', 'top', 'blouse', 'shirt', 'tank', 'cami', 'sweater', 'hoodie', 'sweatshirt', 'bodysuit', 'turtleneck', 'pullover', 'tunic', 'polo', 'jumper']],
  ['accessory', ['necklace', 'earrings', 'earring', 'bracelet', 'ring', 'belt', 'scarf', 'hat', 'cap', 'beanie', 'sunglasses', 'hair clip', 'headband']],
];

// Feed color names → the app's palette.
const COLOR_WORDS = [
  ['burgundy', ['burgundy', 'wine', 'maroon', 'wine red', 'bordeaux']],
  ['navy', ['navy', 'navy blue', 'dark blue']],
  ['denim', ['denim', 'medium wash', 'light wash', 'dark wash', 'blue denim']],
  ['cream', ['cream', 'ivory', 'off white', 'off-white', 'eggshell']],
  ['beige', ['beige', 'apricot', 'khaki', 'nude', 'tan', 'sand', 'champagne', 'oatmeal', 'taupe']],
  ['brown', ['brown', 'camel', 'coffee', 'chocolate', 'mocha', 'cognac', 'rust brown']],
  ['olive', ['olive', 'army green', 'khaki green', 'moss']],
  ['sage', ['sage', 'mint', 'mint green', 'pistachio', 'light green']],
  ['teal', ['teal', 'turquoise', 'aqua']],
  ['green', ['green', 'emerald', 'dark green', 'forest green', 'kelly green']],
  ['lilac', ['lilac', 'lavender', 'light purple', 'mauve']],
  ['purple', ['purple', 'violet', 'plum', 'grape']],
  ['pink', ['pink', 'baby pink', 'dusty pink', 'hot pink', 'fuchsia', 'blush', 'rose']],
  ['red', ['red', 'scarlet', 'cherry']],
  ['orange', ['orange', 'coral', 'rust', 'tangerine', 'terracotta']],
  ['yellow', ['yellow', 'mustard', 'lemon', 'gold']],
  ['blue', ['blue', 'royal blue', 'baby blue', 'light blue', 'sky blue', 'cobalt']],
  ['grey', ['grey', 'gray', 'charcoal', 'silver', 'heather grey', 'dark grey', 'light grey']],
  ['white', ['white']],
  ['black', ['black']],
];

const STYLE_WORDS = {
  casual: ['casual', 'basic', 'basics', 'everyday', 'ezwear', 'solid', 'plain', 'relaxed', 'comfy', 'tee', 'jeans'],
  street: ['street', 'streetwear', 'y2k', 'graphic', 'cargo', 'oversized', 'grunge', 'hip hop', 'parachute', 'letter', 'slogan', 'biker'],
  chic: ['chic', 'satin', 'minimalist', 'french', 'knot', 'square neck', 'cowl', 'trench', 'mod'],
  elegant: ['elegant', 'party', 'evening', 'sequin', 'cocktail', 'formal', 'prom', 'bodycon', 'ruched', 'slip', 'glamorous', 'velvet', 'pearl'],
  boho: ['boho', 'floral', 'peasant', 'tiered', 'ruffle', 'vacation', 'beach', 'crochet', 'linen', 'paisley', 'lace', 'straw'],
  sporty: ['sport', 'sports', 'active', 'gym', 'yoga', 'running', 'track', 'athletic', 'training', 'sneakers', 'windbreaker', 'biker shorts'],
  office: ['office', 'work', 'tailored', 'blazer', 'pencil', 'business', 'trousers', 'button up', 'button front', 'workwear', 'suit'],
};

const CUT_WORDS = {
  cropped: ['crop', 'cropped'],
  fitted: ['fitted', 'slim', 'skinny', 'ribbed knit'],
  bodycon: ['bodycon'],
  wrap: ['wrap'],
  belted: ['belted', 'with belt', 'tie waist'],
  'a-line': ['a-line', 'a line', 'skater'],
  'wide-leg': ['wide leg', 'wide-leg', 'palazzo'],
  flare: ['flare', 'flared', 'bootcut'],
  straight: ['straight leg', 'straight'],
  'high-waist': ['high waist', 'high-waist', 'high waisted', 'high-waisted'],
  oversized: ['oversized', 'drop shoulder', 'boyfriend'],
  'puff-sleeve': ['puff sleeve', 'puff-sleeve', 'balloon sleeve'],
  cowl: ['cowl'],
  'square-neck': ['square neck'],
  'v-neck': ['v neck', 'v-neck', 'plunge'],
  'high-neck': ['high neck', 'turtleneck', 'mock neck', 'funnel neck'],
  midi: ['midi'],
  maxi: ['maxi'],
  mini: ['mini'],
  tiered: ['tiered', 'layered hem'],
  pencil: ['pencil'],
  baggy: ['baggy', 'cargo', 'parachute', 'loose'],
  flowy: ['flowy', 'chiffon', 'floaty'],
  'bias-cut': ['slip'],
  structured: ['structured', 'blazer', 'tailored'],
  longline: ['longline', 'longline', 'long coat', 'maxi coat'],
  chunky: ['chunky'],
  short: ['shorts'],
};

export function categoryOf(text) {
  for (const [cat, words] of CATEGORY_RULES) if (has(text, words)) return cat === 'skip' ? null : cat;
  return null;
}

export function colorOf(colorField = '', title = '') {
  // Prefer the feed's own color field, then the title. Longest phrases first ("navy blue" before "blue").
  for (const text of [colorField, title]) {
    if (!text || /multi|print|pattern/i.test(text) && text === colorField) continue;
    let best = null, bestLen = 0;
    for (const [name, words] of COLOR_WORDS) for (const w of words) {
      if (w.length > bestLen && has(text, [w])) { best = name; bestLen = w.length; }
    }
    if (best) return best;
  }
  return null;
}

export function stylesOf(text) {
  const out = Object.entries(STYLE_WORDS).filter(([, words]) => has(text, words)).map(([s]) => s);
  return out.length ? out.slice(0, 3) : ['casual'];
}

export function cutsOf(text) {
  return Object.entries(CUT_WORDS).filter(([, words]) => has(text, words)).map(([c]) => c);
}

export function priceOf(v) {
  if (typeof v === 'number') return v;
  const m = String(v ?? '').replace(',', '.').match(/\d+(\.\d+)?/);
  return m ? +(+m[0]).toFixed(2) : null;
}

/** Normalize one feed row (any common affiliate column names) into an app product, or null to skip it. */
export function toProduct(row) {
  const pick = (...keys) => {
    for (const k of keys) {
      const hit = Object.keys(row).find((c) => c.toLowerCase().replace(/[^a-z]/g, '') === k);
      if (hit && row[hit] !== '' && row[hit] != null) return String(row[hit]).trim();
    }
    return '';
  };
  const id = pick('id', 'productid', 'awproductid', 'sku', 'merchantproductid', 'catalogitemid');
  const title = pick('title', 'productname', 'name');
  const url = pick('affiliatelink', 'awdeeplink', 'buyurl', 'deeplink', 'link', 'url', 'producturl');
  const image = pick('imagelink', 'imageurl', 'merchantimageurl', 'awimageurl', 'largeimage', 'image');
  const price = priceOf(pick('saleprice', 'searchprice', 'price', 'retailprice', 'storeprice'));
  const typeText = pick('producttype', 'merchantcategory', 'category', 'categoryname', 'googleproductcategory');
  const colorText = pick('color', 'colour');
  const gender = pick('gender');
  const group = pick('itemgroupid', 'parentsku', 'productgroupid');
  if (!id || !title || !url || !price) return null;
  if (/^(male|men|boys?)$/i.test(gender)) return null;

  const text = `${title} ${typeText}`;
  const category = categoryOf(title) || categoryOf(typeText);
  const color = colorOf(colorText, title);
  if (!category || !color) return null;
  return {
    id: `s${id}`.replace(/[^\w-]/g, ''),
    name: group || (colorText ? title.replace(new RegExp(`\\b${colorText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i'), '').trim() : title),
    title: shortTitle(title),
    category,
    color,
    styles: stylesOf(text),
    cuts: cutsOf(title),
    price,
    url,
    ...(image ? { image } : {}),
  };
}

/** SHEIN titles are keyword-stuffed: keep the part before the first comma, at most ~60 characters. */
export function shortTitle(title) {
  let t = title.replace(/^SHEIN\s+/i, '').split(/[,|]/)[0].replace(/\s+/g, ' ').trim();
  if (t.length > 60) t = `${t.slice(0, 60).replace(/\s+\S*$/, '')}…`;
  return t;
}
