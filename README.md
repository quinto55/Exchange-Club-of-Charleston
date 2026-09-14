# Exchange Club of Charleston — website redesign concept

**Live demo:** https://quinto55.github.io/Exchange-Club-of-Charleston/

An unofficial, clickable redesign of [exchangeclubofcharleston.org](https://exchangeclubofcharleston.org/),
prepared for the Exchange Club of Charleston’s review. It fixes every finding in the site audit
([docs/AUDIT.md](docs/AUDIT.md)) — see [docs/AUDIT-MAP.md](docs/AUDIT-MAP.md) for each fix.

**This is a demo.** The giving, RSVP, membership and contact flows run entirely in the browser: nothing
is sent, stored on a server or charged, and every confirmation is labeled *Demo*. The member portal uses
fictional people. Every page is `noindex` and `robots.txt` disallows crawling, so the demo never competes
with the real site in search.

## Ownership

Photographs, the club emblem and the Coastal Carolina Fair logo remain the property of the Exchange Club
of Charleston, the National Exchange Club and the Coastal Carolina Fair. They appear here only as part of
this concept. Gallery and story photos are loaded from the club’s own public photo albums; a small set of
photos and both logos are stored as optimized copies (see `scripts/photos.json`) — the fair logo is stored
rather than hotlinked because the fair’s image server sends a 128 KB file even at 240 px.

## Facts and “Club to confirm”

Facts come from the club’s live site (crawled 2026-09-11) and the Coastal Carolina Fair’s site. Anything
that could not be verified is marked **Club to confirm** on the page. The club would need to supply:

- Annual dues and the expected fair volunteer hours
- The donation processor, tax status and receipts
- Exchange Park Food Court hours
- 2027 Family Festival / Triple B dates
- Details for the three 2026 photo stories (only album titles and dates were available)

## Built with

Static HTML pages, one stylesheet and a few small ES modules — no framework, no runtime dependencies, no
trackers. Vite builds the multi-page site; a small plugin (`plugins/html-partials.js`) shares the header
and footer; Vitest + happy-dom test the logic and every flow against the real page markup;
`scripts/check-dist.mjs` fails the build on missing metadata, heading problems, images without alt text
or dimensions, broken internal links, placeholder links and double-encoded text.

| Command | What it does |
| --- | --- |
| `npm install` | Install Vite, Vitest and happy-dom (Node 20.19+) |
| `npm run dev` | Local dev server |
| `npm test` | Unit and flow tests |
| `npm run build` | Production build into `dist/` |
| `npm run check` | Lint the built site |
| `python3 scripts/optimize-images.py` | Rebuild the stored WebP photos from `scripts/photos.json` |
| `node scripts/render-photos.mjs` | Rewrite the gallery and story photo grids |
| `node scripts/structured-data.mjs` | Rewrite each page’s JSON-LD |

Pushing to `main` runs the tests, builds, lints and deploys to GitHub Pages
(`.github/workflows/deploy.yml`).

## Fonts

Libre Caslon Display, Libre Caslon Text and Public Sans are self-hosted under the SIL Open Font License
(`src/assets/fonts/README.md`).
