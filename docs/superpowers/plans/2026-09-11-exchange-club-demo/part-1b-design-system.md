# Part 1b — Foundation: design system, fonts, images

Plan index: `../2026-09-11-exchange-club-demo.md` (read its **Global Constraints** and **Shared conventions** first).

---

### Task 3: Design system — tokens, base, components, fonts, image pipeline, favicon

**Files:**
- Create: `src/styles/main.css`, `src/styles/tokens.css`, `src/styles/base.css`, `src/styles/components.css`, `src/styles/shell.css`, `src/styles/flows.css`, `src/styles/pages.css`
- Create: `src/assets/fonts/*.woff2` (6 files, downloaded), `src/assets/fonts/README.md`
- Create: `scripts/photos.json` (copied), `scripts/optimize-images.py`, `src/assets/img/*.webp` (generated), `src/assets/favicon.svg`
- Test: `tests/css-tokens.test.js`
- Modify: `partials/head.html` (link the stylesheet)

**Interfaces:**
- Consumes: Task 1 scaffold.
- Produces:
  - Every class listed under **Components** in the plan index (except flow components, which Task 10 adds to `flows.css`, and shell classes, which Task 4 adds to `shell.css`).
  - CSS custom properties exactly as in `tokens.css` below.
  - Image files `src/assets/img/<name>-{480,960,1600}.webp` for the 18 photo names in `scripts/photos.json`, plus `emblem-160.webp`, `emblem-320.webp`, `fair-logo-120.webp`, `fair-logo-240.webp`.
  - `src/assets/favicon.svg`.
  - Rule enforced by `tests/css-tokens.test.js`: colour literals (`#hex`, `rgb()`, `rgba()`, `hsl()`, `hsla()`) appear **only** in `tokens.css`.

**Note on the fair logo (deliberate spec deviation):** the spec §5 says to hotlink the fair logo. The fair CDN serves it as a 128 KB PNG even at 240 px, which contradicts spec principle 5 and the performance budget, so this plan stores an optimized WebP derivative (≈10 KB) instead. The README (Task 16) records the deviation.

- [ ] **Step 1: Download the fonts** (Google Fonts, SIL OFL 1.1, latin subset)

```bash
mkdir -p src/assets/fonts
cd src/assets/fonts
curl -sSfL -o libre-caslon-display-400.woff2      https://fonts.gstatic.com/s/librecaslondisplay/v18/TuGOUUFxWphYQ6YI6q9Xp61FQzxDRKmzr1lWfxk.woff2
curl -sSfL -o libre-caslon-text-400.woff2         https://fonts.gstatic.com/s/librecaslontext/v5/DdT878IGsGw1aF1JU10PUbTvNNaDMfq41-I.woff2
curl -sSfL -o libre-caslon-text-400-italic.woff2  https://fonts.gstatic.com/s/librecaslontext/v5/DdT678IGsGw1aF1JU10PUbTvNNaDMfq95-BDGg.woff2
curl -sSfL -o libre-caslon-text-700.woff2         https://fonts.gstatic.com/s/librecaslontext/v5/DdT578IGsGw1aF1JU10PUbTvNNaDMfID8vdkPx4.woff2
curl -sSfL -o public-sans-var.woff2               https://fonts.gstatic.com/s/publicsans/v21/ijwRs572Xtc6ZYQws9YVwnNGfJ4.woff2
curl -sSfL -o public-sans-var-italic.woff2        https://fonts.gstatic.com/s/publicsans/v21/ijwTs572Xtc6ZYQws9YVwnNDTJzaxw.woff2
cd ../../..
file src/assets/fonts/*.woff2
```

Expected: six lines, each `Web Open Font Format (Version 2)`.

`src/assets/fonts/README.md`:

```markdown
# Fonts

Self-hosted latin subsets from Google Fonts, all under the SIL Open Font License 1.1
(https://openfontlicense.org):

- Libre Caslon Display 400 — Impallari Type
- Libre Caslon Text 400, 400 italic, 700 — Impallari Type
- Public Sans (variable 400–700, roman and italic) — USWDS / General Services Administration
```

- [ ] **Step 2: Write the failing guard test `tests/css-tokens.test.js`**

```js
import { it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const dir = resolve(import.meta.dirname, '../src/styles');
const COLOUR_LITERAL = /#[0-9a-fA-F]{3,8}\b|\brgba?\(|\bhsla?\(/;

it('keeps colour literals in tokens.css only', () => {
  const files = readdirSync(dir).filter((f) => f.endsWith('.css'));
  expect(files).toEqual(
    expect.arrayContaining(['main.css', 'tokens.css', 'base.css', 'components.css', 'shell.css', 'flows.css', 'pages.css']),
  );
  const offenders = files
    .filter((f) => f !== 'tokens.css')
    .flatMap((f) =>
      readFileSync(resolve(dir, f), 'utf8')
        .split('\n')
        .map((line, i) => ({ f, i: i + 1, line }))
        .filter(({ line }) => COLOUR_LITERAL.test(line)),
    )
    .map(({ f, i, line }) => `${f}:${i}: ${line.trim()}`);
  expect(offenders).toEqual([]);
});
```

- [ ] **Step 3: Run it to verify it fails**

Run: `npx vitest run tests/css-tokens.test.js`
Expected: FAIL — `ENOENT` on `src/styles`.

- [ ] **Step 4: Create the stylesheets**

`src/styles/main.css`:

```css
/* Single stylesheet entry; Vite inlines these imports into one CSS file. */
@import './tokens.css';
@import './base.css';
@import './components.css';
@import './shell.css';
@import './flows.css';
@import './pages.css';
```

`src/styles/tokens.css`:

```css
:root {
  /* Colour — spec §4.1. Gold is never text on a light ground; --fair-* only in fair components. */
  --navy: #1B2A6B;
  --navy-deep: #111A45;
  --navy-tint: #E6E9F3;
  --gold: #C9A227;
  --gold-ink: #7A5C0B;
  --linen: #F7F4EC;
  --paper: #FFFFFF;
  --ink: #15193A;
  --muted: #4B5170;
  --rule: #DAD5C7;
  --success: #1F7A4D;
  --danger: #B42318;
  --fair-dusk: #111A3A;
  --fair-red: #D5382C;
  --fair-bulb: #FFC53D;

  /* Type — spec §4.2 */
  --font-display: 'Libre Caslon Display', Georgia, 'Times New Roman', serif;
  --font-serif: 'Libre Caslon Text', Georgia, 'Times New Roman', serif;
  --font-sans: 'Public Sans', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
  --step--1: 0.875rem;
  --step-0: 1.0625rem;
  --step-1: 1.33rem;
  --step-2: clamp(1.9rem, 3.5vw, 2.6rem);
  --step-3: clamp(2.6rem, 6vw, 4.2rem);
  --eyebrow: 0.78rem;

  /* Space, shape, depth */
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-5: 1.5rem;
  --space-6: 2rem;
  --space-7: 3rem;
  --space-8: 4.5rem;
  --space-9: 6rem;
  --radius: 6px;
  --radius-lg: 12px;
  --shadow-1: 0 1px 2px rgb(21 25 58 / 0.08), 0 4px 16px rgb(21 25 58 / 0.06);
  --shadow-2: 0 2px 4px rgb(21 25 58 / 0.08), 0 16px 40px rgb(21 25 58 / 0.14);
  --scrim: rgb(10 14 38 / 0.72);
  --container: 1200px;
  --measure: 66ch;

  color-scheme: light;
}
```

`src/styles/base.css`:

```css
@font-face { font-family: 'Libre Caslon Display'; src: url('../assets/fonts/libre-caslon-display-400.woff2') format('woff2'); font-weight: 400; font-style: normal; font-display: swap; }
@font-face { font-family: 'Libre Caslon Text'; src: url('../assets/fonts/libre-caslon-text-400.woff2') format('woff2'); font-weight: 400; font-style: normal; font-display: swap; }
@font-face { font-family: 'Libre Caslon Text'; src: url('../assets/fonts/libre-caslon-text-400-italic.woff2') format('woff2'); font-weight: 400; font-style: italic; font-display: swap; }
@font-face { font-family: 'Libre Caslon Text'; src: url('../assets/fonts/libre-caslon-text-700.woff2') format('woff2'); font-weight: 700; font-style: normal; font-display: swap; }
@font-face { font-family: 'Public Sans'; src: url('../assets/fonts/public-sans-var.woff2') format('woff2'); font-weight: 400 700; font-style: normal; font-display: swap; }
@font-face { font-family: 'Public Sans'; src: url('../assets/fonts/public-sans-var-italic.woff2') format('woff2'); font-weight: 400 700; font-style: italic; font-display: swap; }

*, *::before, *::after { box-sizing: border-box; }
html { -webkit-text-size-adjust: 100%; scroll-padding-top: 7rem; }
body {
  margin: 0;
  background: var(--linen);
  color: var(--ink);
  font: 400 var(--step-0) / 1.6 var(--font-sans);
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
}
img, svg, video { display: block; max-width: 100%; height: auto; }
h1, h2, h3, h4 { margin: 0; color: var(--navy); text-wrap: balance; }
h1 { font: 400 var(--step-3) / 1.05 var(--font-display); letter-spacing: -0.01em; }
h2 { font: 400 var(--step-2) / 1.12 var(--font-serif); }
h3 { font: 700 var(--step-1) / 1.25 var(--font-serif); }
h4 { font: 700 1.0625rem / 1.35 var(--font-sans); }
p, ul, ol, dl, dd, figure, blockquote { margin: 0; }
a { color: var(--navy); text-underline-offset: 0.18em; text-decoration-thickness: 1px; }
a:hover { text-decoration-thickness: 2px; }
strong { font-weight: 700; }
:focus-visible { outline: 3px solid var(--navy); outline-offset: 2px; border-radius: 2px; }
.section--navy :focus-visible,
.site-footer :focus-visible,
.utility-bar :focus-visible,
.fair-hero :focus-visible,
.fair-card :focus-visible,
.cta-band__panel--navy :focus-visible { outline-color: var(--gold); }
main:focus { outline: none; }
::selection { background: var(--gold); color: var(--navy-deep); }
[hidden] { display: none !important; }
.no-js .js-only { display: none !important; }
.js .no-js-only { display: none !important; }
.visually-hidden {
  position: absolute !important;
  width: 1px; height: 1px;
  margin: -1px; padding: 0;
  overflow: hidden; clip: rect(0 0 0 0);
  white-space: nowrap; border: 0;
}
.skip-link {
  position: absolute; left: var(--space-4); top: -100px; z-index: 100;
  padding: var(--space-3) var(--space-4);
  background: var(--navy); color: var(--paper);
  border-radius: var(--radius); font-weight: 600; text-decoration: none;
}
.skip-link:focus { top: var(--space-4); }
@media (prefers-reduced-motion: no-preference) {
  html { scroll-behavior: smooth; }
  @view-transition { navigation: auto; }
}
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

`src/styles/components.css`:

```css
/* ---------- Layout ---------- */
.container { width: min(100% - 2 * var(--space-5), var(--container)); margin-inline: auto; }
.section { padding-block: clamp(var(--space-7), 8vw, var(--space-9)); }
.section > .container { display: grid; gap: var(--space-6); }
.section--tint { background: var(--navy-tint); }
.section--navy { background: var(--navy); color: var(--linen); }
.section--navy h2, .section--navy h3 { color: var(--paper); }
.section--navy a:not(.btn) { color: var(--paper); }
.section-head { display: grid; gap: var(--space-3); max-width: var(--measure); }
.section-head--center { justify-items: center; margin-inline: auto; text-align: center; }
.eyebrow { font: 600 var(--eyebrow) / 1.2 var(--font-sans); letter-spacing: 0.14em; text-transform: uppercase; color: var(--gold-ink); }
.section--navy .eyebrow, .cta-band__panel--navy .eyebrow { color: var(--gold); }
.lede { max-width: var(--measure); color: var(--muted); font-size: 1.2rem; line-height: 1.55; }
.section--navy .lede { color: var(--navy-tint); }
.prose { display: grid; gap: var(--space-4); max-width: var(--measure); }
.prose ul, .prose ol { display: grid; gap: var(--space-2); padding-left: 1.2em; }
.prose h3 { margin-top: var(--space-3); }
.grid { display: grid; gap: var(--space-5); grid-template-columns: 1fr; }
@media (min-width: 600px) { .grid--4 { grid-template-columns: repeat(2, 1fr); } }
@media (min-width: 760px) {
  .grid--2 { grid-template-columns: repeat(2, 1fr); }
  .grid--3 { grid-template-columns: repeat(3, 1fr); }
}
@media (min-width: 1100px) { .grid--4 { grid-template-columns: repeat(4, 1fr); } }
.split { display: grid; gap: var(--space-6); align-items: center; }
@media (min-width: 900px) {
  .split { grid-template-columns: 1fr 1fr; gap: var(--space-8); }
  .split--reverse > :first-child { order: 2; }
}

/* ---------- Buttons ---------- */
.btn {
  display: inline-flex; align-items: center; justify-content: center; gap: var(--space-2);
  min-height: 44px; padding: 0.7rem 1.25rem;
  border: 2px solid transparent; border-radius: var(--radius);
  font: 600 1rem / 1 var(--font-sans); text-decoration: none; cursor: pointer;
  transition: background-color 0.15s, color 0.15s, border-color 0.15s, transform 0.15s;
}
.btn:active { transform: translateY(1px); }
.btn--primary { background: var(--navy); color: var(--paper); }
.btn--primary:hover { background: var(--navy-deep); }
.btn--secondary { background: transparent; color: var(--navy); border-color: var(--navy); }
.btn--secondary:hover { background: var(--navy); color: var(--paper); }
.btn--give { background: var(--gold); color: var(--navy-deep); }
.btn--give:hover { background: color-mix(in srgb, var(--gold) 86%, var(--navy-deep)); }
.btn--light { background: var(--paper); color: var(--navy); }
.btn--light:hover { background: var(--navy-tint); }
.btn-row { display: flex; flex-wrap: wrap; align-items: center; gap: var(--space-3); }

/* Ticket-stub button: fair module only (.fair-card, .fair-hero). */
.ticket-btn {
  --notch: 9px;
  position: relative;
  display: inline-flex; align-items: center; gap: var(--space-3);
  min-height: 50px; padding: 0.85rem 3.4rem 0.85rem 1.6rem;
  background: var(--fair-red); color: var(--paper);
  font: 700 1rem / 1 var(--font-sans); letter-spacing: 0.08em; text-transform: uppercase; text-decoration: none;
  -webkit-mask:
    radial-gradient(circle var(--notch) at 0 50%, transparent 98%, black) left / 51% 100% no-repeat,
    radial-gradient(circle var(--notch) at 100% 50%, transparent 98%, black) right / 51% 100% no-repeat;
  mask:
    radial-gradient(circle var(--notch) at 0 50%, transparent 98%, black) left / 51% 100% no-repeat,
    radial-gradient(circle var(--notch) at 100% 50%, transparent 98%, black) right / 51% 100% no-repeat;
}
.ticket-btn::after { content: ''; position: absolute; top: 7px; bottom: 7px; right: 2.5rem; border-left: 2px dashed color-mix(in srgb, var(--paper) 60%, transparent); }
.ticket-btn__stub { position: absolute; right: 0.95rem; font-size: 1.1rem; }
.ticket-btn:hover { background: color-mix(in srgb, var(--fair-red) 85%, var(--fair-dusk)); }

/* ---------- Cards ---------- */
.card {
  position: relative; display: flex; flex-direction: column;
  background: var(--paper); border: 1px solid var(--rule); border-radius: var(--radius-lg);
  overflow: hidden; transition: box-shadow 0.2s;
}
.card:hover { box-shadow: var(--shadow-2); }
.card:has(.card__link:focus-visible) { outline: 3px solid var(--navy); outline-offset: 3px; }
.card__media { aspect-ratio: 3 / 2; overflow: hidden; background: var(--navy-tint); }
.card__media img { width: 100%; height: 100%; object-fit: cover; }
.card__body { display: grid; flex: 1; align-content: start; gap: var(--space-2); padding: var(--space-5); }
.card__meta { color: var(--muted); font-size: var(--step--1); font-variant-numeric: tabular-nums; }
.card__title { font: 700 1.2rem / 1.3 var(--font-serif); color: var(--navy); }
.card__link { color: inherit; text-decoration: none; }
.card__link::after { content: ''; position: absolute; inset: 0; }
.card__link:focus-visible { outline: none; }
.card__more { margin-top: var(--space-2); color: var(--navy); font-weight: 600; font-size: 0.95rem; }

/* ---------- Meeting place cards ---------- */
.place-list { display: grid; gap: var(--space-3); margin: 0; padding: 0; list-style: none; }
.place-card {
  display: grid; grid-template-columns: auto 1fr; align-items: center; gap: var(--space-4);
  padding: var(--space-4); background: var(--paper); border: 1px solid var(--rule); border-radius: var(--radius-lg);
}
@media (min-width: 640px) { .place-card { grid-template-columns: auto 1fr auto; } }
.place-card__date {
  display: grid; place-content: center; width: 4.75rem; aspect-ratio: 1;
  background: var(--navy); color: var(--paper); border-radius: var(--radius);
  line-height: 1; text-align: center; font-variant-numeric: tabular-nums;
}
.place-card__month { color: var(--gold); font: 700 0.72rem / 1 var(--font-sans); letter-spacing: 0.14em; }
.place-card__day { margin-top: 0.2rem; font: 400 2.1rem / 1 var(--font-display); }
.place-card__body { display: grid; gap: 0.15rem; }
.place-card__title { color: var(--navy); font: 700 1.05rem / 1.3 var(--font-sans); }
.place-card__meta { color: var(--muted); font-size: 0.95rem; font-variant-numeric: tabular-nums; }
.place-card__tag {
  justify-self: start; margin-top: var(--space-1); padding: 0.15rem 0.55rem;
  background: var(--navy-tint); color: var(--navy); border-radius: 999px;
  font: 600 0.75rem / 1.4 var(--font-sans);
}
.place-card__tag--tentative { background: var(--linen); color: var(--gold-ink); border: 1px dashed var(--gold-ink); }
.place-card__action { grid-column: 1 / -1; justify-self: start; }
@media (min-width: 640px) { .place-card__action { grid-column: auto; } }

/* ---------- Impact figures (inside .section--navy) ---------- */
.impact { display: grid; gap: var(--space-5); margin: 0; padding: 0; list-style: none; grid-template-columns: 1fr; }
@media (min-width: 600px) { .impact { grid-template-columns: repeat(2, 1fr); } }
@media (min-width: 1000px) { .impact { grid-template-columns: repeat(4, 1fr); } }
.impact__item { display: grid; align-content: start; gap: var(--space-2); padding-top: var(--space-4); border-top: 2px solid var(--gold); }
.impact__figure { color: var(--paper); font: 400 clamp(2.4rem, 5vw, 3.4rem) / 1 var(--font-display); font-variant-numeric: tabular-nums; }
.impact__label { color: var(--navy-tint); }
.impact__source { color: var(--navy-tint); font-size: var(--step--1); }

/* ---------- Fair card (fair palette) ---------- */
.fair-card {
  position: relative; display: grid; justify-items: center; gap: var(--space-2);
  padding: var(--space-7) var(--space-5) var(--space-6);
  background: radial-gradient(120% 90% at 50% 0%, color-mix(in srgb, var(--fair-dusk) 75%, var(--navy)) 0%, var(--fair-dusk) 65%);
  color: var(--paper); border-radius: var(--radius-lg); box-shadow: var(--shadow-2);
  text-align: center; overflow: hidden;
}
.fair-card::before {
  content: ''; position: absolute; inset: 12px 14px auto; height: 8px;
  background: radial-gradient(circle, var(--fair-bulb) 2.2px, transparent 2.9px) 0 0 / 18px 8px repeat-x;
}
.fair-card__logo { width: 120px; height: auto; }
.fair-card__eyebrow { color: var(--fair-bulb); font: 600 var(--eyebrow) / 1.2 var(--font-sans); letter-spacing: 0.14em; text-transform: uppercase; }
.fair-card__title { color: var(--paper); font: 400 1.9rem / 1.1 var(--font-display); }
.fair-card__dates { color: var(--fair-bulb); font: 700 1.35rem / 1.2 var(--font-sans); font-variant-numeric: tabular-nums; }
.fair-card__place { color: var(--navy-tint); }
.fair-card__countdown, .fair-hero__countdown {
  padding: var(--space-2) var(--space-4);
  border: 1px solid color-mix(in srgb, var(--fair-bulb) 45%, transparent); border-radius: 999px;
  color: var(--paper); font: 600 0.95rem / 1.4 var(--font-sans); font-variant-numeric: tabular-nums;
}
.fair-card__actions { display: grid; justify-items: center; gap: var(--space-3); margin-top: var(--space-3); }
.fair-card__link { color: var(--paper); font-weight: 600; }

/* ---------- Fair page hero (fair palette) ---------- */
.fair-hero { position: relative; isolation: isolate; overflow: hidden; background: var(--fair-dusk); color: var(--paper); }
.fair-hero__bg { position: absolute; inset: 0; z-index: -2; }
.fair-hero__bg img { width: 100%; height: 100%; object-fit: cover; opacity: 0.5; }
.fair-hero::after { content: ''; position: absolute; inset: 0; z-index: -1; background: linear-gradient(90deg, var(--fair-dusk) 25%, transparent 90%); }
.fair-hero__inner { display: grid; gap: var(--space-4); max-width: 40rem; padding-block: clamp(var(--space-8), 10vw, 8rem); }
.fair-hero h1 { color: var(--paper); }
.fair-hero .eyebrow { color: var(--fair-bulb); }
.fair-hero__dates { color: var(--fair-bulb); font: 700 clamp(1.4rem, 3vw, 2rem) / 1.2 var(--font-sans); font-variant-numeric: tabular-nums; }
.fair-hero__place { color: var(--navy-tint); }
.fair-hero__countdown { justify-self: start; }
.fair-hero a:not(.ticket-btn) { color: var(--paper); font-weight: 600; }

/* ---------- Interior page hero + breadcrumb ---------- */
.page-hero { padding-block: clamp(var(--space-7), 7vw, var(--space-8)) var(--space-6); border-bottom: 1px solid var(--rule); }
.page-hero .container { display: grid; gap: var(--space-4); }
.page-hero .lede { font-size: 1.25rem; }
.breadcrumb ol { display: flex; flex-wrap: wrap; gap: var(--space-2); margin: 0; padding: 0; list-style: none; color: var(--muted); font-size: var(--step--1); }
.breadcrumb li + li::before { content: '/'; margin-right: var(--space-2); }
.breadcrumb a { color: var(--muted); }
.breadcrumb [aria-current='page'] { color: var(--ink); }

/* ---------- Timeline ---------- */
.timeline { display: grid; margin: 0 0 0 0.5rem; padding: 0; border-left: 2px solid var(--gold); list-style: none; }
.timeline__item { position: relative; display: grid; gap: var(--space-1); padding: 0 0 var(--space-6) var(--space-6); }
.timeline__item:last-child { padding-bottom: 0; }
.timeline__item::before {
  content: ''; position: absolute; left: -0.6rem; top: 0.3rem;
  width: 1.1rem; height: 1.1rem; border-radius: 50%;
  background: var(--linen); border: 3px solid var(--navy);
}
.section--tint .timeline__item::before { background: var(--navy-tint); }
.timeline__year { color: var(--navy); font: 400 1.6rem / 1 var(--font-display); font-variant-numeric: tabular-nums; }
.timeline__text { max-width: 56ch; }

/* ---------- Covenant plaque ---------- */
.plaque {
  max-width: 48rem; margin-inline: auto;
  padding: clamp(var(--space-6), 6vw, var(--space-8)) clamp(var(--space-5), 6vw, var(--space-8));
  background: var(--paper); border: 2px solid var(--gold); outline: 1px solid var(--gold); outline-offset: -10px;
  box-shadow: var(--shadow-1); text-align: center;
}
.plaque__title { color: var(--navy); font: 400 clamp(1.7rem, 3vw, 2.3rem) / 1.15 var(--font-display); }
.plaque__rule { width: 4rem; height: 2px; margin: var(--space-4) auto var(--space-5); background: var(--gold); border: 0; }
.plaque__text { display: grid; gap: var(--space-3); color: var(--ink); font: italic 400 1.1rem / 1.6 var(--font-serif); text-align: left; }
.plaque__text p:first-child { font-style: normal; font-weight: 700; }

/* ---------- Pull quote, photo, notes ---------- */
.pullquote { display: grid; justify-items: center; gap: var(--space-3); max-width: 46rem; margin-inline: auto; text-align: center; }
.pullquote blockquote p { color: var(--navy); font: italic 400 clamp(1.4rem, 3vw, 2rem) / 1.35 var(--font-serif); }
.pullquote figcaption { color: var(--muted); font-size: var(--step--1); letter-spacing: 0.08em; text-transform: uppercase; }
.photo { display: grid; gap: var(--space-2); }
.photo img { width: 100%; aspect-ratio: 3 / 2; object-fit: cover; border-radius: var(--radius-lg); }
.photo figcaption { color: var(--muted); font-size: var(--step--1); }
.demo-note {
  display: flex; flex-wrap: wrap; align-items: baseline; gap: var(--space-2);
  padding: var(--space-3) var(--space-4);
  background: var(--paper); border: 1px solid var(--gold); border-radius: var(--radius);
  color: var(--ink); font-size: 0.95rem;
}
.demo-note::before { content: 'Demo'; color: var(--gold-ink); font: 700 0.72rem / 1.4 var(--font-sans); letter-spacing: 0.12em; text-transform: uppercase; }
.club-note { display: inline-flex; align-items: baseline; gap: 0.4rem; color: var(--gold-ink); font-size: 0.85rem; font-weight: 600; }
.club-note::before { content: ''; width: 0.5rem; height: 0.5rem; background: var(--gold); border-radius: 50%; }

/* ---------- Jump nav, leaders, FAQ, CTA band ---------- */
.jump-nav ul { display: flex; flex-wrap: wrap; gap: var(--space-2); margin: 0; padding: 0; list-style: none; }
.jump-nav a {
  display: inline-block; padding: 0.45rem 0.9rem;
  background: var(--paper); border: 1px solid var(--rule); border-radius: 999px;
  font-size: 0.95rem; font-weight: 600; text-decoration: none;
}
.jump-nav a:hover { border-color: var(--navy); }
.leaders { display: grid; gap: 0 var(--space-5); grid-template-columns: repeat(auto-fill, minmax(min(100%, 15rem), 1fr)); margin: 0; padding: 0; list-style: none; }
.leaders li { display: grid; gap: 0.1rem; padding: var(--space-3) 0; border-top: 1px solid var(--rule); }
.leaders__role { color: var(--gold-ink); font: 600 var(--eyebrow) / 1.3 var(--font-sans); letter-spacing: 0.12em; text-transform: uppercase; }
.leaders__name { color: var(--navy); font: 700 1.1rem / 1.3 var(--font-serif); }
.faq { display: grid; gap: var(--space-2); max-width: var(--measure); }
.faq details { background: var(--paper); border: 1px solid var(--rule); border-radius: var(--radius); }
.faq summary {
  display: flex; justify-content: space-between; gap: var(--space-4);
  padding: var(--space-4); color: var(--navy); font-weight: 700; cursor: pointer; list-style: none;
}
.faq summary::-webkit-details-marker { display: none; }
.faq summary::after { content: '+'; color: var(--gold-ink); font: 400 1.4rem / 1 var(--font-sans); }
.faq details[open] summary::after { content: '–'; }
.faq details > :not(summary) { padding: 0 var(--space-4) var(--space-4); }
.cta-band { display: grid; gap: var(--space-5); }
@media (min-width: 760px) { .cta-band { grid-template-columns: 1fr 1fr; } }
.cta-band__panel {
  display: grid; align-content: start; gap: var(--space-3); padding: var(--space-6);
  background: var(--paper); border: 1px solid var(--rule); border-radius: var(--radius-lg);
}
.cta-band__panel--navy { background: var(--navy); border-color: var(--navy); color: var(--linen); }
.cta-band__panel--navy h2 { color: var(--paper); }
.cta-band__panel .btn { justify-self: start; margin-top: var(--space-2); }
```

`src/styles/shell.css`:

```css
/* Site shell (utility bar, header, navigation, footer) — Task 4. */
```

`src/styles/flows.css`:

```css
/* Demo flow components (stepper, fields, choices, confirmation) — Task 10. */
```

`src/styles/pages.css`:

```css
/* Page-specific layout. Each page task appends one block headed with a comment naming the page. */
```

- [ ] **Step 5: Link the stylesheet** — replace `partials/head.html` with:

```html
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="stylesheet" href="/src/styles/main.css">
```

- [ ] **Step 6: Run the guard test to verify it passes**

Run: `npx vitest run tests/css-tokens.test.js`
Expected: PASS.

- [ ] **Step 7: Copy the photo manifest and write the image pipeline**

```bash
cp docs/superpowers/plans/2026-09-11-exchange-club-demo.data/photos.json scripts/photos.json
```

(Create `scripts/` first if needed.) `scripts/optimize-images.py`:

```python
#!/usr/bin/env python3
"""Download the photos and logos in scripts/photos.json and write optimized WebP derivatives
to src/assets/img/. Sources are cached in .cache/photos/ (git-ignored). Re-runnable."""
import json
import pathlib
import subprocess

from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / 'src' / 'assets' / 'img'
CACHE = ROOT / '.cache' / 'photos'
PHOTO_WIDTHS = (480, 960, 1600)


def fetch(url: str, dest: pathlib.Path) -> pathlib.Path:
    if not dest.exists():
        dest.parent.mkdir(parents=True, exist_ok=True)
        subprocess.run(['curl', '-sSfL', '--retry', '3', '-m', '90', '-o', str(dest), url], check=True)
    return dest


def save(im: Image.Image, width: int, path: pathlib.Path, quality: int) -> None:
    height = round(im.height * width / im.width)
    im.resize((width, height), Image.LANCZOS).save(path, 'WEBP', quality=quality, method=6)


def main() -> None:
    manifest = json.loads((ROOT / 'scripts' / 'photos.json').read_text(encoding='utf-8'))
    OUT.mkdir(parents=True, exist_ok=True)
    for photo in manifest['photos']:
        im = Image.open(fetch(photo['source'], CACHE / f"{photo['name']}.jpg")).convert('RGB')
        for width in PHOTO_WIDTHS:
            save(im, width, OUT / f"{photo['name']}-{width}.webp", quality=72)
    for logo in manifest['logos']:
        im = Image.open(fetch(logo['source'], CACHE / f"{logo['name']}.png")).convert('RGBA')
        for width in logo['widths']:
            save(im, width, OUT / f"{logo['name']}-{width}.webp", quality=86)
    for path in sorted(OUT.glob('*.webp')):
        print(f'{path.stat().st_size // 1024:>5} KB  {path.name}')


if __name__ == '__main__':
    main()
```

- [ ] **Step 8: Run the pipeline and check the budgets**

Run: `python3 scripts/optimize-images.py && ls src/assets/img/*.webp | wc -l`
Expected: size table printed; count `58` (18 × 3 + 4). Then confirm budgets:

Run: `python3 -c "import os;d='src/assets/img';s=lambda f:os.path.getsize(f'{d}/{f}')//1024;print('emblem-160',s('emblem-160.webp'),'KB | hero-1600',s('hero-members-1600.webp'),'KB');assert s('emblem-160.webp')<=20 and s('hero-members-1600.webp')<=260"`
Expected: prints both sizes, no AssertionError. (If the hero exceeds 260 KB, lower `quality` for photos to 66 and re-run.)

- [ ] **Step 9: Create `src/assets/favicon.svg`** (simplified seal: palmetto and crescent)

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <circle cx="32" cy="32" r="31" fill="#1B2A6B"/>
  <circle cx="32" cy="32" r="27" fill="none" stroke="#C9A227" stroke-width="2"/>
  <path d="M33 50c-.6-6 0-12 .8-18" fill="none" stroke="#C9A227" stroke-width="3" stroke-linecap="round"/>
  <g fill="none" stroke="#C9A227" stroke-width="2.4" stroke-linecap="round">
    <path d="M33.8 31c-4-4-9-4.6-13-2.4"/>
    <path d="M33.8 31c-2.6-5-2.6-9 0-12.6"/>
    <path d="M33.8 31c2.6-5 6.6-7 11-6.4"/>
    <path d="M33.8 31c4.6-2.6 9-2 12.4 1.4"/>
  </g>
  <path d="M22 20a7 7 0 1 0 6.4 9.8a5.6 5.6 0 1 1-6.4-9.8z" fill="#C9A227"/>
</svg>
```

- [ ] **Step 10: Verify the build bundles fonts**

Run: `npm test && npm run build && ls dist/assets/*.woff2 | wc -l && ls dist/assets/*.css | wc -l`
Expected: tests pass; `6` font files; `1` CSS file.

- [ ] **Step 11: Commit**

```bash
git add src/styles src/assets scripts/photos.json scripts/optimize-images.py partials/head.html tests/css-tokens.test.js
git commit -F - <<'MSG'
feat: add design system, self-hosted fonts and optimized photos

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_019gmTqZ5kCmSQFTwxrVLfuk
MSG
```
