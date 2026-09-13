# Exchange Club of Charleston Demo Site — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a static, multi-page demo of a replacement website for the Exchange Club of Charleston, with four front-end-only demo flows, deployed to GitHub Pages.

**Architecture:** Vite multi-page build of flat root-level HTML pages. A small custom Vite plugin expands `<!-- @include partials/x.html -->` markers so the head/header/footer are written once. Behaviour lives in small ES modules: pure logic in `src/js/lib/` and `src/js/flows/` (unit-tested with Vitest), DOM binding via `mount*()` functions (tested with happy-dom against the real page HTML). A post-build lint (`scripts/check-dist.mjs`) enforces the SEO/a11y/link rules on `dist/`.

**Tech Stack:** Node 20.20, Vite 7.3.x, Vitest 4.1.x, happy-dom 20.x, Python 3.12 + Pillow 12 (image pipeline only), Windows Chrome headless (screenshots + OG image).

**Spec:** `docs/superpowers/specs/2026-09-11-exchange-club-demo-design.md` — read it before any task. The audit it fixes is `docs/AUDIT.md`.

**Plan parts** (tasks are numbered globally, execute in order):

| Part | File | Tasks |
| --- | --- | --- |
| 1a · Foundation | `2026-09-11-exchange-club-demo/part-1a-foundation.md` | 1 Scaffold + partials plugin · 2 Core libraries |
| 1b · Foundation | `2026-09-11-exchange-club-demo/part-1b-design-system.md` | 3 Design system, fonts, images |
| 1c · Foundation | `2026-09-11-exchange-club-demo/part-1c-shell.md` | 4 Site shell, all page files, check-dist (ends with the Part 1 merge) |
| 2 · Content pages | `2026-09-11-exchange-club-demo/part-2-content.md` | 5 Home · 6 The Fair · 7 Programs · 8 About · 9 Stories, gallery, lightbox |
| 3 · Demo flows | `2026-09-11-exchange-club-demo/part-3-flows.md` | 10 Meetings + RSVP · 11 Give + donate · 12 Join + application · 13 Contact · 14 Member portal |
| 4 · Ship | `2026-09-11-exchange-club-demo/part-4-ship.md` | 15 Privacy, 404, robots, sitemap, JSON-LD, OG image · 16 README, AUDIT-MAP, deploy, visual QA |

**Plan data** (`2026-09-11-exchange-club-demo.data/`): `photos.json` (18 curated photos + 2 logos: sources, alt text, dimensions), `gallery.json` (8 albums, 79 hotlinked photos with thumbnail dimensions), `story-photos.json` (6 photos per story page, hotlinked). Tasks copy or read these files; do not retype them.

## Global Constraints

- Repo: `/mnt/c/Users/Anthony Quintana/projects/Exchange-Club-of-Charleston` (Windows-side path; run all commands from it). Node `v20.20.0` — **do not** use packages that require Node 22 (e.g. Vitest 5).
- devDependencies are exactly `vite@^7.3.6`, `vitest@^4.1.11`, `happy-dom@^20.14.5`. No runtime dependencies, no other packages, no CDNs, no third-party scripts.
- Live base path: `/Exchange-Club-of-Charleston/`. Live origin for canonical/OG URLs: `https://quinto55.github.io/Exchange-Club-of-Charleston/`.
- Pages are flat files at the repo root; internal page links are **relative** (`about.html`, `programs.html#youth`). Assets are referenced root-absolute from HTML (`/src/assets/...`, `/src/styles/main.css`, `/src/js/...`) so Vite rewrites them; CSS references fonts relatively (`../assets/fonts/...`).
- Every page: `<!doctype html>`, `<html lang="en" class="no-js">`, `<!-- @include partials/head.html -->` first in `<head>`, unique `<title>` and meta description, canonical, OG + Twitter tags, exactly one non-empty `<h1>`, `<body data-page="<key>">`, header and footer partials, `<main id="main" tabindex="-1">`.
- Share-safe demo: `<meta name="robots" content="noindex">` on every page (in `partials/head.html`) and `public/robots.txt` with `Disallow: /`.
- Copy rules: facts only from the spec §7; anything unverified uses the `club-note` component with the text "Club to confirm". Never invent events, numbers or quotes. Portal people are fictional. No minors as focal photo subjects.
- Demo honesty: flows never call `fetch`/XHR/`sendBeacon`; every confirmation says *Demo*. Payment step has **no card inputs**; portal has **no password input**.
- Colours only from the tokens in spec §4.1 (defined in `src/styles/tokens.css`). Gold (`--gold`) is never text on a light ground. Fair colours (`--fair-*`) only inside `.fair-card`, `.fair-hero`, `.ticket-btn`.
- Accessibility floor: skip link, landmarks, visible focus, AA contrast, labelled controls, `aria-live` error/step announcements, keyboard-complete flows, `prefers-reduced-motion` respected.
- Commits: one or more per task, conventional prefixes (`feat:`, `test:`, `chore:`, `docs:`, `fix:`). **Every commit message ends with these two lines:**
  ```
  Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
  Claude-Session: https://claude.ai/code/session_019gmTqZ5kCmSQFTwxrVLfuk
  ```
- Branching: all tasks run on branch `feat/demo-site` (create it from `main` in Task 1). At the end of each plan part, merge into `main` with `git merge --no-ff feat/demo-site`, then `git push origin main` (push is pre-approved for this repo). Keep working on `feat/demo-site` afterwards.
- Gate before every commit: `npm test` passes and `npm run build` passes. From Task 4 on, `npm run check` must also pass.

## File map

```
index.html fair.html programs.html give.html join.html meetings.html stories.html
story-fair-workday-2026.html story-spring-festival-2026.html story-fair-appreciation-2026.html
story-scholarships-2024.html story-blue-gold-2024.html story-dee-norton-2024.html
about.html gallery.html contact.html portal.html privacy.html 404.html      ← pages (root)
partials/head.html  partials/header.html  partials/footer.html  partials/seal.html
plugins/html-partials.js                    Vite plugin + pure applyPartials()
src/styles/main.css                         @imports the files below (bundled to one CSS file)
src/styles/tokens.css base.css components.css flows.css pages.css
src/assets/fonts/*.woff2                    self-hosted fonts (Task 3)
src/assets/img/*.webp                       optimized photos + logos (Task 3, generated)
src/assets/favicon.svg                      seal favicon
src/data/club.js meetings.js funds.js stories.js gallery.js portal-demo.js
src/js/main.js                              site shell behaviour (pure exports, no side effects)
src/js/site.js                              entry loaded on every page; calls init() from main.js
src/js/lib/dates.js validate.js ref.js ics.js storage.js stepper.js form-errors.js summary.js meeting-cards.js
src/js/flows/rsvp.js donate.js join.js contact.js portal.js lightbox.js
src/js/pages/meetings.js give.js join.js contact.js portal.js gallery.js   ← per-page entry modules
partials/lightbox.html                      photo viewer dialog (gallery + story pages)
scripts/optimize-images.py                  photos.json → src/assets/img/*.webp
scripts/photos.json                         copied from plan data
scripts/render-photos.mjs                   writes gallery + story photo grids into HTML
scripts/structured-data.mjs                 writes JSON-LD into each page head
scripts/check-dist.mjs                      post-build site lint
scripts/og.html                             OG image template (rendered by Chrome)
scripts/qa-overflow.html                    dev-only horizontal-overflow harness (Task 16)
.github/workflows/deploy.yml                test → build → check → deploy Pages (added end of Part 1, Ruling 7)
public/robots.txt public/sitemap.xml public/og/og-default.png
tests/*.test.js tests/helpers/load-page.js
docs/AUDIT-MAP.md README.md .github/workflows/deploy.yml
```

## Shared conventions (read once; every task relies on these)

**Page skeleton** (Task 4 creates all pages in this form; later tasks only edit inside `<main>` and add page scripts before `</body>`):

```html
<!doctype html>
<html lang="en" class="no-js">
<head>
<!-- @include partials/head.html -->
<title>About · Exchange Club of Charleston</title>
<meta name="description" content="…">
<link rel="canonical" href="https://quinto55.github.io/Exchange-Club-of-Charleston/about.html">
<meta property="og:title" content="About · Exchange Club of Charleston">
<meta property="og:description" content="…">
<meta property="og:url" content="https://quinto55.github.io/Exchange-Club-of-Charleston/about.html">
<meta property="og:image" content="https://quinto55.github.io/Exchange-Club-of-Charleston/og/og-default.png">
</head>
<body data-page="about">
<!-- @include partials/header.html -->
<main id="main" tabindex="-1">
  …
</main>
<!-- @include partials/footer.html -->
</body>
</html>
```

**Responsive photo** (all stored photos are 3:2; the files exist at 480/960/1600 widths):

```html
<img src="/src/assets/img/NAME-960.webp"
     srcset="/src/assets/img/NAME-480.webp 480w, /src/assets/img/NAME-960.webp 960w, /src/assets/img/NAME-1600.webp 1600w"
     sizes="SIZES" width="1600" height="1067" loading="lazy" decoding="async" alt="ALT from photos.json">
```

`NAME` and `ALT` come from `scripts/photos.json`. `SIZES` is given per use in each task. The single above-the-fold photo on a page uses `fetchpriority="high"` and omits `loading="lazy"`.

**Components** (CSS in Task 3; class names are fixed — use them, do not invent parallel ones): `container`, `section`, `section--tint`, `section--navy`, `section-head`, `eyebrow`, `lede`, `prose`, `grid`, `grid--2`, `grid--3`, `grid--4`, `split`, `split--reverse`, `btn` + `btn--primary|--secondary|--give|--light`, `ticket-btn`, `card` (`card__media`, `card__body`, `card__title`, `card__meta`, `card__link`), `place-card` (`place-card__date`, `__month`, `__day`, `__body`, `__title`, `__meta`, `__tag`, `__action`), `impact` (`impact__item`, `impact__figure`, `impact__label`, `impact__source`), `fair-card` (…), `fair-hero`, `timeline` (`timeline__item`, `timeline__year`, `timeline__text`), `plaque`, `pullquote`, `photo` (figure), `breadcrumb`, `page-hero`, `demo-note`, `club-note`, `jump-nav`, `leaders`, `faq`, `cta-band`. Flow components (Task 10+): `flow`, `stepper`, `field`, `field__error`, `choice-grid`, `choice`, `confirm`.

## Task index

1. Scaffold, partials plugin, test harness — part 1
2. Core libraries: dates, validation, reference IDs, ICS, storage — part 1
3. Design system: tokens, base, components CSS, fonts, image pipeline, favicon — part 1
4. Site shell: head/header/footer/seal partials, `main.js`, all page files with final metadata, `check-dist` — part 1
5. Home page — part 2
6. The Fair page — part 2
7. Programs page — part 2
8. About page — part 2
9. Stories index, six story pages, gallery, photo-grid renderer, lightbox — part 2
10. Meetings page + RSVP flow (introduces `stepper.js`, `form-errors.js`) — part 3
11. Give page + donate flow — part 3
12. Join page + membership application flow — part 3
13. Contact page + contact flow — part 3
14. Member portal — part 3
15. Privacy, 404, robots, sitemap, JSON-LD, OG image — part 4
16. README, AUDIT-MAP, deploy workflow, push, visual QA — part 4
