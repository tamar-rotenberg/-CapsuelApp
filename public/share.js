// Turn a look into a shareable image (1080×1350, Instagram portrait size).
import { COLORS } from './colors.js';
import { PATHS } from './icons.js';

const W = 1080, H = 1350, PAD = 64;
const APP_URL = 'tamar-rotenberg.github.io/-CapsuelApp';

/** Draw the look and return a PNG blob. */
export async function lookImage(look, title = 'My look') {
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const g = c.getContext('2d');
  const font = (w, s) => `${w} ${s}px system-ui, -apple-system, "Segoe UI", sans-serif`;

  g.fillStyle = '#faf7f5';
  g.fillRect(0, 0, W, H);

  // Header
  g.fillStyle = '#1d1b1a';
  g.font = font(800, 56);
  g.fillText('Capsule', PAD, PAD + 50);
  g.font = font(600, 36);
  g.fillText(title, PAD, PAD + 120);
  g.fillStyle = '#2f8a55';
  g.textAlign = 'right';
  g.fillText(`${look.score}% match`, W - PAD, PAD + 120);
  g.textAlign = 'left';

  // Items: up to 6 tiles, 3 per row
  const items = look.items.slice(0, 6);
  const cols = 3, gap = 24, top = PAD + 170;
  const tile = (W - PAD * 2 - gap * (cols - 1)) / cols;
  const rowH = tile + 120;
  items.forEach((p, i) => {
    const x = PAD + (i % cols) * (tile + gap);
    const y = top + Math.floor(i / cols) * (rowH + gap);
    g.fillStyle = '#f3eee9';
    roundRect(g, x, y, tile, tile, 24);
    g.fill();
    // Garment drawing, scaled from its 100×100 box
    g.save();
    const s = (tile * 0.72) / 100;
    g.translate(x + tile * 0.14, y + tile * 0.14);
    g.scale(s, s);
    const path = new Path2D(PATHS[p.category] || PATHS.top);
    g.fillStyle = COLORS[p.color].hex;
    g.fill(path, 'evenodd');
    g.strokeStyle = 'rgba(0,0,0,.25)';
    g.lineWidth = 1.5;
    g.stroke(path);
    g.restore();
    // Name (up to 2 lines) + price
    g.fillStyle = '#1d1b1a';
    g.font = font(500, 26);
    wrap(g, p.title, x, y + tile + 38, tile, 32, 2);
    g.font = font(700, 26);
    g.fillText(`$${p.price.toFixed(2)}`, x, y + tile + 108);
  });

  // Why it works
  const rows = Math.ceil(items.length / cols);
  let y = top + rows * (rowH + gap) + 20;
  if (look.reasons?.length) {
    g.fillStyle = '#6f6a66';
    g.font = font(400, 28);
    const text = look.reasons.join(' · ');
    y = wrap(g, text[0].toUpperCase() + text.slice(1), PAD, y, W - PAD * 2, 38, 3);
  }

  // Footer
  const total = look.items.reduce((s, p) => s + p.price, 0);
  g.fillStyle = '#1d1b1a';
  g.font = font(700, 32);
  g.fillText(`Total $${total.toFixed(2)} on SHEIN`, PAD, H - PAD - 44);
  g.fillStyle = '#6f6a66';
  g.font = font(400, 26);
  g.fillText(`Styled by Capsule · ${APP_URL}`, PAD, H - PAD);

  return new Promise((resolve) => c.toBlob(resolve, 'image/png'));
}

/** Share with the phone's share sheet, or download the image where sharing files isn't supported. */
export async function shareLook(look, title) {
  const blob = await lookImage(look, title);
  const file = new File([blob], 'capsule-look.png', { type: 'image/png' });
  const text = `My ${title.toLowerCase()} from Capsule: ${look.items.map((p) => p.title).join(', ')}`;
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: 'Capsule look', text });
      return 'shared';
    } catch (e) {
      if (e.name === 'AbortError') return 'cancelled';
    }
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'capsule-look.png';
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  return 'downloaded';
}

function roundRect(g, x, y, w, h, r) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}

/** Draw wrapped text; returns the y after the last line. */
function wrap(g, text, x, y, maxW, lineH, maxLines) {
  const words = text.split(' ');
  let line = '', lines = 0;
  for (let i = 0; i < words.length; i++) {
    const test = line ? `${line} ${words[i]}` : words[i];
    if (g.measureText(test).width > maxW && line) {
      if (lines === maxLines - 1) { g.fillText(`${line}…`, x, y); return y + lineH; }
      g.fillText(line, x, y);
      line = words[i]; y += lineH; lines++;
    } else line = test;
  }
  g.fillText(line, x, y);
  return y + lineH;
}
