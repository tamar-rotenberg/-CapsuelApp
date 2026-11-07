# How Dressly works (and how Capsule copies the logic)

Research from public sources: App Store listing, review blogs and user reviews (Nov 2026).
Dressly ("Dressly: AI Outfit Stylist", by TIKVEX LIMITED, Cyprus; ~4.5★ from ~18K ratings)
is a subscription AI stylist app ($11.99/week, $34.99/month or $79.99/year).

## The core idea

Dressly does not start from your closet. It starts from **you**: it builds a profile
(colors that suit your face, body shape, taste), and then every outfit it shows is
filtered and ranked by that profile. The outfits are made of items from online stores
(users use it heavily for SHEIN and Amazon), each with a buy link.

## The user flow

| Step | What Dressly does | Logic behind it |
|---|---|---|
| 1. Selfie + color analysis | Scans the face (skin, hair, eye color) and puts you in one of **12 color seasons** (e.g. "Soft Autumn"), with a personal palette. Reviewers call this the strongest feature. | Classic seasonal color analysis: undertone (warm/cool) × value (light/deep) × chroma (bright/soft) → season → palette of flattering colors. |
| 2. Body scan / body shape | Detects body shape (hourglass, pear, apple, rectangle, inverted triangle) and tells you which cuts work. | Stylist rules: each shape has silhouettes that balance it (e.g. pear → A-line skirts, wide-leg pants, detail on top). |
| 3. Style quiz | Style preferences, favorite brands/stores, budget, sizes. | Hard filters (budget, store) + soft preferences (style tags). |
| 4. Swipe training | Shows outfit cards you like/dislike (a progress counter, ~20 cards). | Learns weights for styles and colors from your reactions (preference learning). |
| 5. Personal feed | A feed of complete outfits made for you, with "buy" links per item. | Outfit generation (color harmony + style fit) **ranked by your profile**: palette fit + body-shape fit + learned taste + budget. |
| 6. Outfit scanner | Photograph an outfit you're wearing → score out of 100 + written reasoning and a suggested fix. Reviewers say the number is inconsistent but the written reasoning is useful. | Detect the colors/pieces, score color harmony + palette fit + proportions, explain, suggest a swap. |
| 7. Capsule wardrobe | Builds a small set of pieces that mix into many outfits. | Choose N items that maximize the number of good combinations within palette and budget. |
| 8. Digital closet + virtual try-on | Save your own items; render a store item on your photo before buying. | Closet = saved items that the generator prefers. Try-on = generative image model (out of scope for this POC). |

## Known weak spots (opportunities for us)

- Buy links often break or are out of stock (links depend on third-party stores).
- Outfit score is inconsistent between scans of the same outfit → make ours deterministic and explain it.
- Billing complaints (weekly subscription, upsells at signup).
- Some users feel outfits aren't really personalized → show *why* each look was picked for you.

## What Capsule implements in this POC

| Dressly feature | Capsule | Notes |
|---|---|---|
| Color analysis (12 seasons) | ✅ Quiz (undertone / depth / brightness) + optional selfie skin-tone sampling → season + palette | A real app would use a face-landmark model for skin/hair/eyes. |
| Body shape | ✅ Pick from 5 shapes, or compute from bust/waist/hip measurements | Catalog items carry silhouette tags (a-line, wide-leg, bodycon…) scored per shape. |
| Style quiz | ✅ Styles + budget | |
| Swipe training | ✅ 20 like/dislike outfit cards → learned style & color weights | |
| Personal feed | ✅ "For you" outfits ranked by profile, with a "why it's for you" line | |
| Outfit scanner | ✅ Upload an outfit photo → colors of top/bottom → score /100 + reasons + SHEIN swap | Deterministic, same photo = same score. |
| Capsule wardrobe | ✅ Greedy builder: N pieces in your palette and budget, shows how many outfits they make | |
| Digital closet | ✅ Save items ("I own this"); feed prefers them | |
| Virtual try-on | ❌ Not in POC | Needs a generative try-on model / API. |
| Real SHEIN products | ❌ Mock catalog + SHEIN search links | Needs SHEIN affiliate feed. |

## Sources

- [Dressly on the App Store](https://apps.apple.com/us/app/dressly-ai-outfit-maker/id6738174180)
- [Cinapse review](https://cinapse.co/dressly-review-how-its-ai-stylist-app-helps-women-dress-better-in-2026/)
- [Awaylands review](https://www.awaylands.com/story/dressly-review-does-the-ai-stylist-actually-work-in-2026/)
- [Style Within Grace review](https://stylewithingrace.com/dressly-review/)
- [Fashion AI Daily review](https://fashionaidaily.com/blog/is-dressly-worth-it-2026-review/)
- [Rumbie review](https://rumbie.co/dressly-app-review-ai-personal-stylist-that-builds-well-balanced-outfits-in-seconds/)
- [MercoPress overview](https://en.mercopress.com/2026/06/09/what-is-dressly-user-reviews-features-and-3-problems-it-solves)
- [Trustpilot](https://www.trustpilot.com/review/dressly.world), [PissedConsumer](https://dressly.pissedconsumer.com/review.html)
- [Dealroom company profile](https://app.dealroom.co/companies/dressly)
