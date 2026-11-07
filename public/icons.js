// Simple flat garment drawings, tinted with the product color (stand-ins for product photos).
const PATHS = {
  top: 'M30 18 L42 12 Q50 20 58 12 L70 18 L84 34 L74 42 L68 36 L68 88 L32 88 L32 36 L26 42 L16 34 Z',
  bottom: 'M30 12 L70 12 L74 88 L56 88 L50 36 L44 88 L26 88 Z',
  skirt: 'M34 14 L66 14 L82 84 Q50 92 18 84 Z',
  dress: 'M38 10 L44 10 Q50 18 56 10 L62 10 L60 32 L80 88 Q50 94 20 88 L40 32 Z',
  outerwear: 'M32 14 L44 10 L50 30 L56 10 L68 14 L86 32 L80 88 L58 88 L50 34 L42 88 L20 88 L14 32 Z',
  shoes: 'M14 58 L40 52 L58 62 Q80 64 86 72 L86 80 L14 80 Z',
  bag: 'M36 36 Q36 16 50 16 Q64 16 64 36 L60 36 Q60 22 50 22 Q40 22 40 36 Z M20 36 L80 36 L84 84 L16 84 Z',
  accessory: 'M50 14 A34 34 0 1 1 49.9 14 Z M50 24 A24 24 0 1 0 50.1 24 Z',
};

export function garmentSvg(category, hex) {
  const stroke = 'rgba(0,0,0,.25)';
  return `<svg viewBox="0 0 100 100" aria-hidden="true"><path d="${PATHS[category] || PATHS.top}" fill="${hex}" stroke="${stroke}" stroke-width="1.5" fill-rule="evenodd" stroke-linejoin="round"/></svg>`;
}
