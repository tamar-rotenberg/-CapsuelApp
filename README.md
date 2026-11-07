# Capsule — a Dressly-style AI stylist (POC)

Capsule copies the logic of the Dressly app: it builds your style profile
(color season, body shape, taste), then shows complete outfits from SHEIN ranked for you.
See [docs/DRESSLY_ANALYSIS.md](docs/DRESSLY_ANALYSIS.md) for how Dressly works and what we copied.

## Try it

**Live app:** https://tamar-rotenberg.github.io/-CapsuelApp/ (deployed automatically from `main`).
On a phone, use "Add to Home Screen" to install it like an app; it also works offline.

## Run locally

```bash
npm start        # http://localhost:3000  (no dependencies to install)
npm test         # engine tests
```

## The flow

1. **Your colors**: 3 quick questions (or a selfie) → one of 12 color seasons + palette.
2. **Your shape**: pick a body shape, or enter bust / waist / hips.
3. **Your style**: styles you like + budget per outfit.
4. **Train your stylist**: 20 outfit cards, like or dislike (tap or swipe).
5. Then the app has 5 tabs:
   - **For you**: personal outfit feed, each look with a "% for you" score and why it was picked.
   - **Style it**: pick a SHEIN item or upload your own piece → outfits around it.
   - **Scan**: photo of your outfit → score /100, what works / what doesn't, one SHEIN swap.
   - **Capsule**: ~11 pieces in your palette and budget that mix into many outfits.
   - **Me**: your palette, colors to avoid, shape tips, and your closet ("I own this").

| Colors | Swipe | Feed | Scan | Capsule |
|---|---|---|---|---|
| ![](docs/screenshots/1-colors.png) | ![](docs/screenshots/2-swipe.png) | ![](docs/screenshots/3-feed.png) | ![](docs/screenshots/4-scan.png) | ![](docs/screenshots/5-capsule.png) |

## Code map

| File | What it does |
|---|---|
| `public/catalog.js` | Mock SHEIN-style catalog (~150 products) with style and cut tags. Links open a SHEIN search. |
| `public/matcher.js` | Outfit building: color harmony + style fit, fills outfit slots around one piece. |
| `public/profile.js` | 12 color seasons, body-shape rules, taste learned from swipes, personal outfit score + reasons. |
| `public/stylist.js` | Swipe deck, personal feed, outfit scanner, capsule builder. |
| `public/vision.js` | In-browser color reading from photos (skin tone, top / bottom colors). |
| `public/views/*` | One file per screen. Profile is saved in the browser. |

## Not in this POC

- Virtual try-on (needs a generative try-on model).
- Real SHEIN products (needs SHEIN's affiliate feed; scraping breaks their terms).
- Real face / body detection (a model would replace the simple photo color reading).
