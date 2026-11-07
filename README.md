# Capsule — outfit matcher POC

A proof of concept of a Dressly-style app: pick one clothing item (or upload a photo of your own),
and the app builds complete outfits around it from a SHEIN-style catalog, each piece linking to SHEIN.

## Run

```bash
npm start        # http://localhost:3000  (no dependencies to install)
npm test         # matching-engine tests
```

## How it works

| File | What it does |
|---|---|
| `public/catalog.js` | Mock catalog (~150 products: tops, bottoms, skirts, dresses, outerwear, shoes, bags, accessories). Links open a SHEIN search for each item. |
| `public/colors.js` | Color palette, plus mapping any photo pixel to the nearest named color. |
| `public/matcher.js` | The engine. Scores pairs on **color harmony** (neutrals, analogous, complementary, clashing) and **style fit** (casual, chic, street…), then fills each outfit slot (e.g. top → bottom + shoes + bag, optional jacket/accessory). Avoids repeating pieces across looks; supports vibe and budget filters. |
| `public/app.js` | UI: browse/search, photo upload with automatic color detection, outfit results. |

## Next steps toward a real product

1. **Real products**: SHEIN affiliate program / product feed instead of mock data (scraping breaks their terms).
2. **Better photo understanding**: send uploaded photos to a vision model to get category, color, pattern and style automatically.
3. **Real product photos** and per-item attributes (pattern, fabric, fit, season).
4. **Learning from users**: likes/saves to personalize the ranking.
5. Mobile app shell (React Native / Expo) once the flow is validated.
