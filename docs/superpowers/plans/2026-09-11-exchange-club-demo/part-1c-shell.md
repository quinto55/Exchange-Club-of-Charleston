# Part 1c — Foundation: site shell, every page file, check-dist

Plan index: `../2026-09-11-exchange-club-demo.md` (read its **Global Constraints** and **Shared conventions** first).

---

### Task 4: Site shell — partials, shell CSS, `main.js`, meeting cards, all page files, check-dist

**Files:**
- Replace: `partials/head.html`, `partials/header.html`
- Create: `partials/footer.html`, `partials/seal.html`
- Modify: `src/styles/shell.css`
- Create: `src/js/main.js`, `src/js/site.js`, `src/js/lib/meeting-cards.js`, `scripts/check-dist.mjs`, `tests/helpers/load-page.js`
- Create (generated once): all page files listed in Step 9 (replaces the Task 1 `index.html`)
- Test: `tests/main.test.js`, `tests/meeting-cards.test.js`, `tests/check-dist.test.js`

**Interfaces:**
- Consumes: `CLUB`, `FAIR` (`src/data/club.js`), `MEETINGS` (`src/data/meetings.js`), `upcomingMeetings`, `countdownState`, `countdownText`, `meetingDateParts` (`src/js/lib/dates.js`), `applyPartials` (`plugins/html-partials.js`), all Task 3 CSS classes and assets.
- Produces:
  - `src/js/main.js` (no side effects on import): `initMenu(doc)`, `initHeaderShadow(doc, win)`, `nextMeetingText(now) → string`, `initNextMeeting(doc, now)`, `initCountdowns(doc, clock, win) → stop()`, `initMeetingLists(doc, now)`, `init(doc)`.
  - `src/js/site.js`: entry module loaded on every page by the footer partial; calls `init()`.
  - `src/js/lib/meeting-cards.js`: `meetingCardHtml(meeting, { action: 'link' | 'none' }) → string` (one `<li class="place-card">`), `renderMeetingCards(listEl, meetings, opts)`.
  - DOM hooks any page may use: `[data-next-meeting]` (text replaced), `[data-countdown]` (text replaced every second), `ul[data-meeting-list]` with optional `data-limit` (default 3) and `data-action` (`link` default | `none`).
  - `tests/helpers/load-page.js`: `loadPage(file, doc = document)` — renders a page's `<body>` (partials expanded, `<script>` tags removed) into happy-dom and sets `html.js` + `body[data-page]`.
  - `scripts/check-dist.mjs`: exports `BASE`, `checkPage(html) → { title, description, problems: string[] }`, `internalRefs(html) → string[]`, `resolveRef(ref, fromFile, distDir) → boolean`; run as a script it lints every `dist/*.html` and exits 1 on any problem. `npm run check` runs it.
  - Static meeting-card markup (for pages that show meetings without JS) must match `meetingCardHtml` output exactly.

- [ ] **Step 1: Write the partials**

`partials/head.html`:

```html
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<!-- Demo concept for the Exchange Club of Charleston. Remove noindex (and the robots.txt Disallow) at real launch. -->
<meta name="robots" content="noindex">
<meta name="color-scheme" content="light">
<meta name="theme-color" content="#1B2A6B">
<link rel="icon" href="/src/assets/favicon.svg" type="image/svg+xml">
<link rel="preload" href="/src/assets/fonts/libre-caslon-display-400.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/src/assets/fonts/public-sans-var.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/src/styles/main.css">
<meta property="og:site_name" content="Exchange Club of Charleston">
<meta property="og:type" content="website">
<meta name="twitter:card" content="summary_large_image">
<script>document.documentElement.classList.replace('no-js', 'js');</script>
```

`partials/seal.html` (the ring path is defined once, in the header partial, so ids never repeat):

```html
<svg class="seal" viewBox="0 0 120 120" aria-hidden="true" focusable="false">
  <circle cx="60" cy="60" r="59" fill="#1B2A6B"/>
  <circle cx="60" cy="60" r="55" fill="none" stroke="#C9A227" stroke-width="1.5"/>
  <circle cx="60" cy="60" r="36" fill="none" stroke="#C9A227" stroke-width="1"/>
  <text fill="#F7F4EC" font-family="Public Sans, system-ui, sans-serif" font-size="7.4" font-weight="700" letter-spacing="1">
    <textPath href="#seal-ring" textLength="284" lengthAdjust="spacing">UNITY FOR SERVICE · EXCHANGE CLUB OF CHARLESTON · 1923 ·</textPath>
  </text>
  <path d="M47 44a9 9 0 1 0 8.2 12.6a7.2 7.2 0 1 1-8.2-12.6z" fill="#C9A227"/>
  <path d="M61 86c-.9-9-.2-18 1.2-27" fill="none" stroke="#C9A227" stroke-width="3.4" stroke-linecap="round"/>
  <g fill="none" stroke="#C9A227" stroke-width="2.4" stroke-linecap="round">
    <path d="M62.2 58c-5.6-5.8-12.4-6.6-18-3.4"/>
    <path d="M62.2 58c-3.6-7-3.6-12.6 0-17.6"/>
    <path d="M62.2 58c3.6-7 9.2-9.8 15.4-9"/>
    <path d="M62.2 58c6.4-3.6 12.6-2.8 17.4 2"/>
    <path d="M62.2 58c-7.4-1.4-12.8 1.8-15.6 7.6"/>
    <path d="M62.2 58c7.4-.6 12.2 2.8 14.2 8.4"/>
  </g>
</svg>
```

`partials/header.html`:

```html
<svg class="visually-hidden" aria-hidden="true" focusable="false"><defs><path id="seal-ring" d="M60 60m-46 0a46 46 0 1 1 92 0a46 46 0 1 1-92 0"/></defs></svg>
<a class="skip-link" href="#main">Skip to content</a>
<div class="utility-bar">
  <div class="container utility-bar__inner">
    <p class="utility-bar__meeting" data-next-meeting>Thursdays at 12:00 PM · Charleston Rifle Club</p>
    <nav class="utility-bar__links" aria-label="Utility">
      <a href="meetings.html#rsvp">RSVP as a guest</a>
      <a href="portal.html" data-nav="portal">Member portal</a>
    </nav>
  </div>
</div>
<header class="site-header" data-site-header>
  <div class="container site-header__inner">
    <a class="brand" href="index.html" aria-label="Exchange Club of Charleston — home">
      <!-- @include partials/seal.html -->
      <span class="brand__text"><span class="brand__name">Exchange Club</span><span class="brand__place">of Charleston</span></span>
    </a>
    <nav class="site-nav" id="site-nav" aria-label="Main">
      <ul class="site-nav__list">
        <li><a href="programs.html" data-nav="programs">Programs</a></li>
        <li><a href="fair.html" data-nav="fair">The Fair</a></li>
        <li><a href="meetings.html" data-nav="meetings">Meetings</a></li>
        <li><a href="stories.html" data-nav="stories">Stories</a></li>
        <li><a href="about.html" data-nav="about">About</a></li>
      </ul>
      <div class="site-nav__actions">
        <a class="btn btn--primary" href="join.html" data-nav="join">Join</a>
      </div>
    </nav>
    <div class="site-header__actions">
      <a class="btn btn--give" href="give.html" data-nav="give">Give</a>
      <button class="menu-toggle" type="button" aria-expanded="false" aria-controls="site-nav" data-menu-toggle>
        <span class="menu-toggle__bars" aria-hidden="true"></span><span>Menu</span>
      </button>
    </div>
  </div>
</header>
```

`partials/footer.html`:

```html
<footer class="site-footer">
  <div class="container site-footer__inner">
    <div class="site-footer__brand">
      <!-- @include partials/seal.html -->
      <p class="site-footer__name">Exchange Club of Charleston</p>
      <p>Unity for Service since 1923. Owner and operator of the Coastal Carolina Fair.</p>
    </div>
    <div class="site-footer__col">
      <h2 class="site-footer__heading">Meet us</h2>
      <p>Thursdays at 12:00 PM<br>Charleston Rifle Club<br>2221 Heriot St, Charleston, SC 29403</p>
      <p><a href="meetings.html#rsvp">Reserve a guest seat</a></p>
    </div>
    <nav class="site-footer__col" aria-label="Footer">
      <h2 class="site-footer__heading">Explore</h2>
      <ul>
        <li><a href="programs.html">Programs of Service</a></li>
        <li><a href="fair.html">The Coastal Carolina Fair</a></li>
        <li><a href="stories.html">Stories</a></li>
        <li><a href="gallery.html">Photo gallery</a></li>
        <li><a href="about.html">About the club</a></li>
        <li><a href="contact.html">Contact</a></li>
      </ul>
    </nav>
    <div class="site-footer__col">
      <h2 class="site-footer__heading">Get involved</h2>
      <ul>
        <li><a href="join.html">Join the club</a></li>
        <li><a href="give.html">Give</a></li>
        <li><a href="portal.html">Member portal</a></li>
        <li><a href="https://www.facebook.com/ExchangeClubofCharlestonSC" rel="noopener">Club on Facebook</a></li>
        <li><a href="https://www.facebook.com/CoastalCarolinaFair" rel="noopener">Fair on Facebook</a></li>
      </ul>
    </div>
  </div>
  <div class="site-footer__base">
    <div class="container site-footer__base-inner">
      <img src="/src/assets/img/emblem-160.webp" srcset="/src/assets/img/emblem-160.webp 1x, /src/assets/img/emblem-320.webp 2x" width="48" height="45" loading="lazy" decoding="async" alt="National Exchange Club emblem">
      <p>Unofficial redesign concept prepared for the Exchange Club of Charleston — not the club's official website. Photos © Exchange Club of Charleston.</p>
      <p><a href="privacy.html">Privacy</a></p>
    </div>
  </div>
</footer>
<script type="module" src="/src/js/site.js"></script>
```

- [ ] **Step 2: Replace `src/styles/shell.css`**

```css
/* ---------- Utility bar ---------- */
.utility-bar { background: var(--navy-deep); color: var(--navy-tint); font-size: 0.875rem; }
.utility-bar__inner { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: var(--space-2) var(--space-5); padding-block: var(--space-2); }
.utility-bar__meeting { font-variant-numeric: tabular-nums; }
.utility-bar__links { display: flex; gap: var(--space-4); }
.utility-bar a { color: var(--paper); font-weight: 600; text-decoration: none; }
.utility-bar a:hover, .utility-bar a[aria-current='page'] { text-decoration: underline; }
@media (max-width: 599px) { .utility-bar__meeting { flex-basis: 100%; } }

/* ---------- Header + navigation ---------- */
.site-header { position: sticky; top: 0; z-index: 50; background: var(--linen); border-bottom: 1px solid var(--rule); transition: box-shadow 0.2s; }
.site-header[data-scrolled] { box-shadow: var(--shadow-1); }
.site-header__inner { display: flex; align-items: center; gap: var(--space-5); min-height: 76px; }
.brand { display: flex; align-items: center; gap: var(--space-3); margin-right: auto; color: var(--navy); text-decoration: none; }
.brand .seal { flex: none; width: 52px; height: 52px; }
.brand__text { display: grid; line-height: 1.05; }
.brand__name { font: 400 1.35rem / 1 var(--font-display); }
.brand__place { color: var(--gold-ink); font: 600 0.72rem / 1.4 var(--font-sans); letter-spacing: 0.16em; text-transform: uppercase; }
.site-nav { display: flex; align-items: center; gap: var(--space-5); }
.site-nav__list { display: flex; gap: var(--space-5); margin: 0; padding: 0; list-style: none; }
.site-nav__list a { position: relative; padding-block: var(--space-2); color: var(--ink); font-weight: 600; text-decoration: none; }
.site-nav__list a:hover, .site-nav__list a[aria-current='page'] { color: var(--navy); }
.site-nav__list a[aria-current='page']::after { content: ''; position: absolute; left: 0; right: 0; bottom: -2px; height: 3px; background: var(--gold); border-radius: 2px; }
.site-header__actions { display: flex; align-items: center; gap: var(--space-3); }
.menu-toggle { display: none; }
html.js-scroll-lock { overflow: hidden; }

@media (max-width: 899px) {
  .site-header__inner { min-height: 64px; }
  .brand .seal { width: 44px; height: 44px; }
  .brand__name { font-size: 1.15rem; }
  .menu-toggle {
    display: inline-flex; align-items: center; gap: var(--space-2); min-height: 44px; padding: 0 var(--space-3);
    background: transparent; border: 2px solid var(--navy); border-radius: var(--radius);
    color: var(--navy); font: 600 0.95rem / 1 var(--font-sans); cursor: pointer;
  }
  .menu-toggle__bars, .menu-toggle__bars::before, .menu-toggle__bars::after {
    position: relative; display: block; width: 18px; height: 2px; background: currentColor; border-radius: 1px; transition: transform 0.2s;
  }
  .menu-toggle__bars::before, .menu-toggle__bars::after { content: ''; position: absolute; left: 0; }
  .menu-toggle__bars::before { top: -6px; }
  .menu-toggle__bars::after { top: 6px; }
  .menu-toggle[aria-expanded='true'] .menu-toggle__bars { background: transparent; }
  .menu-toggle[aria-expanded='true'] .menu-toggle__bars::before { transform: translateY(6px) rotate(45deg); }
  .menu-toggle[aria-expanded='true'] .menu-toggle__bars::after { transform: translateY(-6px) rotate(-45deg); }
  .site-nav {
    position: fixed; inset: var(--header-h, 64px) 0 0 0; z-index: 49;
    display: none; flex-direction: column; align-items: stretch; gap: var(--space-5);
    padding: var(--space-5); background: var(--linen); overflow-y: auto;
  }
  .site-header[data-open] .site-nav { display: flex; }
  .site-nav__list { flex-direction: column; gap: 0; }
  .site-nav__list a { display: block; padding: var(--space-4) 0; border-bottom: 1px solid var(--rule); color: var(--navy); font: 400 1.6rem / 1.2 var(--font-serif); }
  .site-nav__list a[aria-current='page']::after { display: none; }
  .site-nav__actions .btn { width: 100%; }
  /* Without JavaScript the menu is simply shown inline. */
  .no-js .menu-toggle { display: none; }
  .no-js .site-header__inner { flex-wrap: wrap; }
  .no-js .site-nav { position: static; display: flex; width: 100%; padding: 0 0 var(--space-4); }
}

/* ---------- Footer ---------- */
.site-footer { background: var(--navy-deep); color: var(--navy-tint); }
.site-footer__inner { display: grid; grid-template-columns: 1fr; gap: var(--space-6); padding-block: var(--space-8) var(--space-7); }
@media (min-width: 760px) { .site-footer__inner { grid-template-columns: 1.3fr 1fr 1fr 1fr; } }
.site-footer .seal { width: 64px; height: 64px; }
.site-footer__brand, .site-footer__col { display: grid; align-content: start; gap: var(--space-3); }
.site-footer__name { color: var(--paper); font: 400 1.5rem / 1.1 var(--font-display); }
.site-footer__heading { color: var(--gold); font: 600 var(--eyebrow) / 1.2 var(--font-sans); letter-spacing: 0.14em; text-transform: uppercase; }
.site-footer ul { display: grid; gap: var(--space-2); margin: 0; padding: 0; list-style: none; }
.site-footer a { color: var(--paper); }
.site-footer__base { border-top: 1px solid color-mix(in srgb, var(--navy-tint) 18%, transparent); }
.site-footer__base-inner { display: flex; flex-wrap: wrap; align-items: center; gap: var(--space-3) var(--space-5); padding-block: var(--space-5); font-size: var(--step--1); }
.site-footer__base-inner p:first-of-type { flex: 1 1 24rem; }

/* ---------- Interior page heroes: story byline ---------- */
.story-meta { color: var(--muted); font-variant-numeric: tabular-nums; }
```

- [ ] **Step 3: Write the failing tests**

`tests/helpers/load-page.js`:

```js
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { applyPartials } from '../../plugins/html-partials.js';

const root = resolve(import.meta.dirname, '../..');
const read = (name) => readFileSync(resolve(root, name), 'utf8');

/** Render a page's <body> (partials expanded, scripts removed) into the happy-dom document. */
export function loadPage(file, doc = document) {
  const html = applyPartials(read(file), read);
  const [, bodyAttrs, bodyHtml] = html.match(/<body([^>]*)>([\s\S]*)<\/body>/i);
  doc.documentElement.className = 'js';
  doc.body.dataset.page = bodyAttrs.match(/data-page="([^"]+)"/)?.[1] ?? '';
  doc.body.innerHTML = bodyHtml.replace(/<script\b[\s\S]*?<\/script>/gi, '');
  return doc;
}
```

`tests/meeting-cards.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { meetingCardHtml, renderMeetingCards } from '../src/js/lib/meeting-cards.js';

describe('meeting cards', () => {
  it('renders a place card with the date block, long date and a reserve link', () => {
    const html = meetingCardHtml({ date: '2026-09-17', title: 'Weekly Club Meeting', tentative: false });
    expect(html).toBe(
      '<li class="place-card"><p class="place-card__date" aria-hidden="true"><span class="place-card__month">SEP</span><span class="place-card__day">17</span></p><div class="place-card__body"><p class="place-card__title">Weekly Club Meeting</p><p class="place-card__meta"><time datetime="2026-09-17T12:00">Thursday, September 17, 2026</time> · 12:00 PM</p><p class="place-card__meta">Charleston Rifle Club</p><span class="place-card__tag">Guests welcome</span></div><a class="btn btn--secondary place-card__action" href="meetings.html#rsvp">Reserve a seat<span class="visually-hidden"> for Thursday, September 17, 2026</span></a></li>',
    );
  });

  it('labels tentative meetings and can omit the action', () => {
    const html = meetingCardHtml({ date: '2026-11-12', title: 'Weekly Club Meeting', tentative: true }, { action: 'none' });
    expect(html).toContain('place-card__tag--tentative">Tentative</span>');
    expect(html).not.toContain('<a ');
  });

  it('renders a list', () => {
    const ul = document.createElement('ul');
    renderMeetingCards(ul, [{ date: '2026-09-17', title: 'A' }, { date: '2026-10-01', title: 'B' }]);
    expect(ul.querySelectorAll('li.place-card')).toHaveLength(2);
  });
});
```

`tests/main.test.js`:

```js
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadPage } from './helpers/load-page.js';
import { initMenu, nextMeetingText, initNextMeeting, initCountdowns, initMeetingLists } from '../src/js/main.js';

describe('site shell', () => {
  beforeEach(() => loadPage('index.html'));

  it('toggles the mobile menu and closes it with Escape', () => {
    initMenu(document);
    const toggle = document.querySelector('[data-menu-toggle]');
    const header = document.querySelector('[data-site-header]');
    toggle.click();
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(header.hasAttribute('data-open')).toBe(true);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(header.hasAttribute('data-open')).toBe(false);
    expect(document.activeElement).toBe(toggle);
  });

  it('writes the next meeting into the utility bar', () => {
    expect(nextMeetingText(new Date('2026-09-11T12:00:00-04:00'))).toBe(
      'Next meeting: Thu, Sep 17 · 12:00 PM · Charleston Rifle Club',
    );
    initNextMeeting(document, new Date('2026-09-18T12:00:00-04:00'));
    expect(document.querySelector('[data-next-meeting]').textContent).toBe(
      'Next meeting: Thu, Oct 1 · 12:00 PM · Charleston Rifle Club',
    );
  });

  it('fills countdowns and can stop the timer', () => {
    document.body.insertAdjacentHTML('beforeend', '<p data-countdown>fallback</p>');
    const win = { setInterval: vi.fn(() => 7), clearInterval: vi.fn() };
    const stop = initCountdowns(document, () => new Date('2026-10-27T13:59:30-04:00'), win);
    expect(document.querySelector('[data-countdown]').textContent).toBe('2 days · 01:00:30 until gates open');
    expect(win.setInterval).toHaveBeenCalledOnce();
    stop();
    expect(win.clearInterval).toHaveBeenCalledWith(7);
  });

  it('renders upcoming meetings into [data-meeting-list]', () => {
    document.body.insertAdjacentHTML('beforeend', '<ul class="place-list" data-meeting-list data-limit="2"></ul>');
    initMeetingLists(document, new Date('2026-10-02T12:00:00-04:00'));
    const cards = document.querySelectorAll('[data-meeting-list] .place-card');
    expect(cards).toHaveLength(2);
    expect(cards[0].textContent).toContain('Thursday, October 8, 2026');
    expect(cards[0].querySelector('a').getAttribute('href')).toBe('meetings.html#rsvp');
  });
});
```

`tests/check-dist.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { checkPage, internalRefs, resolveRef } from '../scripts/check-dist.mjs';

const page = ({ head = '', body = '<h1>Title</h1>' } = {}) => `<!doctype html><html><head>
<meta name="robots" content="noindex"><title>About · Exchange Club of Charleston</title>
<meta name="description" content="About the club.">
<link rel="canonical" href="https://quinto55.github.io/Exchange-Club-of-Charleston/about.html">
<meta property="og:title" content="About"><meta property="og:description" content="About the club.">
<meta property="og:url" content="https://quinto55.github.io/Exchange-Club-of-Charleston/about.html">
<meta property="og:image" content="https://quinto55.github.io/Exchange-Club-of-Charleston/og/og-default.png">
<meta name="twitter:card" content="summary_large_image">${head}</head><body>${body}</body></html>`;

describe('checkPage', () => {
  it('passes a complete page', () => {
    const result = checkPage(page());
    expect(result.problems).toEqual([]);
    expect(result.title).toBe('About · Exchange Club of Charleston');
    expect(result.description).toBe('About the club.');
  });

  it('flags heading problems', () => {
    expect(checkPage(page({ body: '<h1>A</h1><h1>B</h1>' })).problems).toContain('expected exactly one <h1>, found 2');
    expect(checkPage(page({ body: '<h1> </h1>' })).problems).toContain('empty <h1>');
    expect(checkPage(page({ body: '<h1>A</h1><h3>C</h3>' })).problems).toContain('heading level skips from h1 to h3');
    expect(checkPage(page({ body: '<h1>A</h1><h2></h2>' })).problems).toContain('empty <h2>');
  });

  it('flags images without alt or dimensions', () => {
    const { problems } = checkPage(page({ body: '<h1>A</h1><img src="a.webp"><img src="b.webp" alt="" width="1" height="1">' }));
    expect(problems.filter((p) => p.startsWith('img without alt'))).toHaveLength(1);
    expect(problems.filter((p) => p.startsWith('img without width/height'))).toHaveLength(1);
  });

  it('flags placeholder links, double encoding and duplicate ids', () => {
    const { problems } = checkPage(page({
      body: '<h1>A &amp;amp; B</h1><a href="">x</a><a href="http://www.google.com/ ">y</a><p id="d"></p><p id="d"></p>',
    }));
    expect(problems).toEqual(expect.arrayContaining([
      'empty href', 'google.com placeholder link', 'double-encoded &amp;amp;', 'duplicate id: d',
    ]));
  });

  it('flags missing metadata', () => {
    const { problems } = checkPage('<html><head><title>T</title></head><body><h1>A</h1></body></html>');
    expect(problems).toEqual(expect.arrayContaining([
      'missing meta description', 'missing robots noindex', 'missing og:title', 'missing og:image', 'missing twitter:card', 'missing canonical',
    ]));
  });
});

describe('internal references', () => {
  it('collects local href/src/srcset values and skips external ones', () => {
    const refs = internalRefs('<a href="about.html#x">a</a><a href="https://x.org">b</a><img src="/Exchange-Club-of-Charleston/assets/a.webp" srcset="/Exchange-Club-of-Charleston/assets/a.webp 480w, /Exchange-Club-of-Charleston/assets/b.webp 960w"><a href="#top">c</a><a href="mailto:a@b.c">d</a>');
    expect(refs).toEqual(['about.html#x', '/Exchange-Club-of-Charleston/assets/a.webp', '/Exchange-Club-of-Charleston/assets/a.webp', '/Exchange-Club-of-Charleston/assets/b.webp']);
  });

  it('resolves relative and base-absolute paths inside dist', () => {
    const dist = mkdtempSync(join(tmpdir(), 'dist-'));
    mkdirSync(join(dist, 'assets'));
    writeFileSync(join(dist, 'about.html'), '');
    writeFileSync(join(dist, 'assets', 'a.webp'), '');
    const from = join(dist, 'index.html');
    expect(resolveRef('about.html#x', from, dist)).toBe(true);
    expect(resolveRef('/Exchange-Club-of-Charleston/assets/a.webp', from, dist)).toBe(true);
    expect(resolveRef('missing.html', from, dist)).toBe(false);
    expect(resolveRef('/src/assets/a.webp', from, dist)).toBe(false);
  });
});
```

- [ ] **Step 4: Run the tests to verify they fail**

Run: `npx vitest run tests/meeting-cards.test.js tests/main.test.js tests/check-dist.test.js`
Expected: FAIL — `meeting-cards.js`, `main.js` and `check-dist.mjs` do not exist.

- [ ] **Step 5: Implement `src/js/lib/meeting-cards.js`**

```js
import { meetingDateParts } from './dates.js';
import { CLUB } from '../../data/club.js';

/** One meeting as a place card. Keep static page markup identical to this output. */
export function meetingCardHtml(meeting, { action = 'link' } = {}) {
  const { month, day, long } = meetingDateParts(meeting.date);
  const tag = meeting.tentative
    ? '<span class="place-card__tag place-card__tag--tentative">Tentative</span>'
    : '<span class="place-card__tag">Guests welcome</span>';
  const link =
    action === 'link'
      ? `<a class="btn btn--secondary place-card__action" href="meetings.html#rsvp">Reserve a seat<span class="visually-hidden"> for ${long}</span></a>`
      : '';
  return (
    '<li class="place-card">' +
    `<p class="place-card__date" aria-hidden="true"><span class="place-card__month">${month}</span><span class="place-card__day">${day}</span></p>` +
    '<div class="place-card__body">' +
    `<p class="place-card__title">${meeting.title}</p>` +
    `<p class="place-card__meta"><time datetime="${meeting.date}T12:00">${long}</time> · ${CLUB.meeting.time}</p>` +
    `<p class="place-card__meta">${CLUB.meeting.venue}</p>` +
    `${tag}</div>${link}</li>`
  );
}

export function renderMeetingCards(list, meetings, opts) {
  list.innerHTML = meetings.map((m) => meetingCardHtml(m, opts)).join('');
}
```

Add the place-card date block layout to `src/styles/components.css` — the month/day spans stack:

```css
.place-card__date > span { display: block; }
```

(Append that line directly after the `.place-card__day` rule.)

- [ ] **Step 6: Implement `src/js/main.js` and `src/js/site.js`**

`src/js/main.js`:

```js
import { CLUB, FAIR } from '../data/club.js';
import { MEETINGS } from '../data/meetings.js';
import { countdownState, countdownText, meetingDateParts, upcomingMeetings } from './lib/dates.js';
import { renderMeetingCards } from './lib/meeting-cards.js';

/** Mobile menu: toggle button, Escape to close, close after choosing a link. */
export function initMenu(doc = document) {
  const header = doc.querySelector('[data-site-header]');
  const toggle = doc.querySelector('[data-menu-toggle]');
  if (!header || !toggle) return;
  const setOpen = (open) => {
    toggle.setAttribute('aria-expanded', String(open));
    header.toggleAttribute('data-open', open);
    doc.documentElement.classList.toggle('js-scroll-lock', open);
    if (open) {
      doc.documentElement.style.setProperty('--header-h', `${Math.round(header.getBoundingClientRect().bottom)}px`);
    }
  };
  toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));
  doc.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
      setOpen(false);
      toggle.focus();
    }
  });
  header.querySelectorAll('.site-nav a').forEach((a) => a.addEventListener('click', () => setOpen(false)));
}

export function initHeaderShadow(doc = document, win = window) {
  const header = doc.querySelector('[data-site-header]');
  if (!header) return;
  const update = () => header.toggleAttribute('data-scrolled', win.scrollY > 8);
  update();
  win.addEventListener('scroll', update, { passive: true });
}

export function nextMeetingText(now) {
  const [next] = upcomingMeetings(MEETINGS, now, 1);
  return `Next meeting: ${meetingDateParts(next.date).short} · ${CLUB.meeting.time} · ${CLUB.meeting.venue}`;
}

export function initNextMeeting(doc = document, now = new Date()) {
  doc.querySelectorAll('[data-next-meeting]').forEach((el) => {
    el.textContent = nextMeetingText(now);
  });
}

/** Live fair countdown in every [data-countdown]; returns a function that stops the timer. */
export function initCountdowns(doc = document, clock = () => new Date(), win = window) {
  const els = [...doc.querySelectorAll('[data-countdown]')];
  if (els.length === 0) return () => {};
  const start = new Date(FAIR.start);
  const end = new Date(FAIR.end);
  const tick = () => {
    const text = countdownText(countdownState(clock(), start, end));
    els.forEach((el) => {
      el.textContent = text;
    });
  };
  tick();
  const id = win.setInterval(tick, 1000);
  return () => win.clearInterval(id);
}

/** Re-render static meeting lists so past meetings drop off and the list never empties. */
export function initMeetingLists(doc = document, now = new Date()) {
  doc.querySelectorAll('[data-meeting-list]').forEach((list) => {
    const limit = Number(list.dataset.limit || 3);
    renderMeetingCards(list, upcomingMeetings(MEETINGS, now, limit).slice(0, limit), {
      action: list.dataset.action || 'link',
    });
  });
}

export function init(doc = document) {
  doc.documentElement.classList.replace('no-js', 'js');
  initMenu(doc);
  initHeaderShadow(doc);
  initNextMeeting(doc);
  initCountdowns(doc);
  initMeetingLists(doc);
}
```

`src/js/site.js`:

```js
import { init } from './main.js';

init();
```

- [ ] **Step 7: Implement `scripts/check-dist.mjs`**

```js
#!/usr/bin/env node
// Post-build site lint: fails (exit 1) on any SEO, accessibility or link problem in dist/*.html.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

export const BASE = '/Exchange-Club-of-Charleston/';
const ORIGIN = 'https://quinto55.github.io/Exchange-Club-of-Charleston/';

const attr = (tag, name) => tag.match(new RegExp(`\\s${name}\\s*=\\s*"([^"]*)"`, 'i'))?.[1];
const text = (html) => html.replace(/<[^>]+>/g, '').trim();

export function checkPage(html) {
  const problems = [];
  const head = html.match(/<head>([\s\S]*?)<\/head>/i)?.[1] ?? '';
  const body = html.match(/<body\b[\s\S]*<\/body>/i)?.[0] ?? '';
  const metas = [...head.matchAll(/<meta\b[^>]*>/gi)].map((m) => m[0]);
  const byName = (n) => metas.find((t) => attr(t, 'name') === n);
  const byProp = (p) => metas.find((t) => attr(t, 'property') === p);

  const title = head.match(/<title>([\s\S]*?)<\/title>/i)?.[1]?.trim();
  if (!title) problems.push('missing <title>');
  const description = attr(byName('description') ?? '', 'content');
  if (!description) problems.push('missing meta description');
  if (attr(byName('robots') ?? '', 'content') !== 'noindex') problems.push('missing robots noindex');
  for (const p of ['og:title', 'og:description', 'og:url', 'og:image']) {
    if (!attr(byProp(p) ?? '', 'content')) problems.push(`missing ${p}`);
  }
  if (!byName('twitter:card')) problems.push('missing twitter:card');
  const canonical = [...head.matchAll(/<link\b[^>]*>/gi)].map((m) => m[0]).find((t) => attr(t, 'rel') === 'canonical');
  if (!attr(canonical ?? '', 'href')?.startsWith(ORIGIN)) problems.push('missing canonical');

  const h1s = [...body.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)].map((m) => text(m[1]));
  if (h1s.length !== 1) problems.push(`expected exactly one <h1>, found ${h1s.length}`);
  else if (!h1s[0]) problems.push('empty <h1>');
  let previous = 0;
  for (const m of body.matchAll(/<h([1-6])\b/gi)) {
    const level = Number(m[1]);
    if (previous && level > previous + 1) problems.push(`heading level skips from h${previous} to h${level}`);
    previous = level;
  }
  for (const m of body.matchAll(/<h([2-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi)) {
    if (!text(m[2])) problems.push(`empty <h${m[1]}>`);
  }
  for (const m of body.matchAll(/<img\b[^>]*>/gi)) {
    if (attr(m[0], 'alt') === undefined) problems.push(`img without alt: ${m[0].slice(0, 80)}`);
    if (!attr(m[0], 'width') || !attr(m[0], 'height')) problems.push(`img without width/height: ${m[0].slice(0, 80)}`);
  }
  if (/\shref=""/i.test(html)) problems.push('empty href');
  if (/href="https?:\/\/(www\.)?google\.com\/?\s*"/i.test(html)) problems.push('google.com placeholder link');
  if (html.includes('&amp;amp;')) problems.push('double-encoded &amp;amp;');
  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
  const duplicates = [...new Set(ids.filter((id, i) => ids.indexOf(id) !== i))];
  if (duplicates.length) problems.push(`duplicate id: ${duplicates.join(', ')}`);
  return { title, description, problems };
}

export function internalRefs(html) {
  const refs = [...html.matchAll(/\s(?:href|src)="([^"]+)"/gi)].map((m) => m[1]);
  for (const m of html.matchAll(/\ssrcset="([^"]+)"/gi)) {
    for (const part of m[1].split(',')) refs.push(part.trim().split(/\s+/)[0]);
  }
  return refs.filter((u) => !/^(https?:|mailto:|tel:|data:|#|javascript:)/i.test(u));
}

export function resolveRef(ref, fromFile, distDir) {
  const [path] = ref.split(/[?#]/);
  if (!path) return true;
  let full = null;
  if (path.startsWith(BASE)) full = join(distDir, decodeURI(path.slice(BASE.length)));
  else if (!path.startsWith('/')) full = resolve(dirname(fromFile), decodeURI(path));
  return full !== null && existsSync(full);
}

function main() {
  const dist = resolve(import.meta.dirname, '..', 'dist');
  if (!existsSync(dist)) {
    console.error('dist/ not found — run `npm run build` first.');
    process.exit(1);
  }
  const files = readdirSync(dist).filter((f) => f.endsWith('.html')).sort();
  const seenTitles = new Map();
  const seenDescriptions = new Map();
  let failures = 0;
  for (const file of files) {
    const path = join(dist, file);
    const html = readFileSync(path, 'utf8');
    const { title, description, problems } = checkPage(html);
    for (const ref of internalRefs(html)) {
      if (!resolveRef(ref, path, dist)) problems.push(`broken internal link: ${ref}`);
    }
    if (title && seenTitles.has(title)) problems.push(`duplicate <title> (also in ${seenTitles.get(title)})`);
    if (description && seenDescriptions.has(description)) problems.push(`duplicate description (also in ${seenDescriptions.get(description)})`);
    if (title) seenTitles.set(title, file);
    if (description) seenDescriptions.set(description, file);
    for (const problem of problems) console.error(`✗ ${file}: ${problem}`);
    failures += problems.length;
  }
  if (failures) {
    console.error(`\n${failures} problem(s) across ${files.length} pages.`);
    process.exit(1);
  }
  console.log(`✓ ${files.length} pages checked — no problems.`);
}

if (process.argv[1] && resolve(process.argv[1]) === import.meta.filename) main();
```

- [ ] **Step 8: Run the unit tests** — `main.test.js` still fails until the pages exist (Step 9).

Run: `npx vitest run tests/meeting-cards.test.js tests/check-dist.test.js`
Expected: PASS (3 + 7 tests).

- [ ] **Step 9: Generate every page file with its final metadata**

Create `/tmp/scaffold-pages.mjs` (outside the repo — it is run once, then deleted):

```js
// Run from the repo root: node /tmp/scaffold-pages.mjs
import { writeFileSync } from 'node:fs';

const ORIGIN = 'https://quinto55.github.io/Exchange-Club-of-Charleston/';
const esc = (s) => s.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;');

const pages = [
  { file: 'index.html', page: 'home', kind: 'home', title: 'Exchange Club of Charleston — Unity for Service since 1923',
    description: 'The Exchange Club of Charleston has served the Lowcountry since 1923 and runs the Coastal Carolina Fair, which funds scholarships, grants and child-abuse prevention.',
    h1: 'Unity for Service, since 1923.', lede: 'The Exchange Club of Charleston — the volunteers behind the Coastal Carolina Fair.' },
  { file: 'fair.html', page: 'fair', kind: 'interior', crumb: 'The Fair', title: 'The Coastal Carolina Fair · Exchange Club of Charleston',
    description: 'The Coastal Carolina Fair returns to Exchange Park in Ladson Oct 29 – Nov 8, 2026. Run by the Exchange Club of Charleston since 1957 to fund local giving.',
    h1: 'The Coastal Carolina Fair', lede: 'Our flagship fundraiser since 1957 — Oct 29 – Nov 8, 2026 at Exchange Park in Ladson.' },
  { file: 'programs.html', page: 'programs', kind: 'interior', crumb: 'Programs of Service', title: 'Programs of Service · Exchange Club of Charleston',
    description: 'Child-abuse prevention, Americanism, youth scholarships and community service — how the Exchange Club of Charleston serves the Lowcountry.',
    h1: 'Programs of Service', lede: 'Exchange clubs serve through four programs. Here’s how the Charleston club puts each one to work — most of it funded by the Coastal Carolina Fair.' },
  { file: 'give.html', page: 'give', kind: 'interior', crumb: 'Give', title: 'Give · Exchange Club of Charleston',
    description: 'Give to scholarships, child-abuse prevention or community grants through the Exchange Club of Charleston. Every gift stays in the Lowcountry.',
    h1: 'Give', lede: 'Every gift stays in the Lowcountry. Choose where yours goes.' },
  { file: 'join.html', page: 'join', kind: 'interior', crumb: 'Join', title: 'Join the club · Exchange Club of Charleston',
    description: 'Join the Exchange Club of Charleston: a Thursday lunch, fair shifts and a century-old tradition of service. Start your application.',
    h1: 'Join the Exchange Club', lede: 'Build leadership and friendships, and put your time behind the Lowcountry’s biggest fall tradition.' },
  { file: 'meetings.html', page: 'meetings', kind: 'interior', crumb: 'Meetings & events', title: 'Meetings & events · Exchange Club of Charleston',
    description: 'The Exchange Club of Charleston meets for lunch every Thursday at noon at the Charleston Rifle Club. Guests are welcome — reserve a seat.',
    h1: 'Meetings & events', lede: 'We meet for lunch every Thursday at noon. Guests are welcome — come hear the speaker and meet the members.' },
  { file: 'stories.html', page: 'stories', kind: 'interior', crumb: 'Stories', title: 'Stories · Exchange Club of Charleston',
    description: 'News, photos and program highlights from the Exchange Club of Charleston.',
    h1: 'Stories', lede: 'News, photos and program highlights from the club.' },
  { file: 'story-fair-workday-2026.html', page: 'stories', kind: 'story', date: '2026-06-06', dateLabel: 'June 6, 2026',
    title: 'Fair workday at Exchange Park · Stories · Exchange Club of Charleston',
    description: 'Photos from the Exchange Club of Charleston’s June 6, 2026 fair workday at Exchange Park.', h1: 'Fair workday at Exchange Park' },
  { file: 'story-spring-festival-2026.html', page: 'stories', kind: 'story', date: '2026-04', dateLabel: 'April 2026',
    title: 'Spring Festival 2026 · Stories · Exchange Club of Charleston',
    description: 'Photos from the 2026 Spring Festival at Exchange Park, with members and Citadel cadets working the grounds.', h1: 'Spring Festival 2026' },
  { file: 'story-fair-appreciation-2026.html', page: 'stories', kind: 'story', date: '2026-01-17', dateLabel: 'January 17, 2026',
    title: '2026 Fair Appreciation Party · Stories · Exchange Club of Charleston',
    description: 'Photos from the Exchange Club of Charleston’s Fair Appreciation Party on January 17, 2026.', h1: '2026 Fair Appreciation Party' },
  { file: 'story-scholarships-2024.html', page: 'stories', kind: 'story', date: '2024-03-07', dateLabel: 'March 7, 2024',
    title: 'Thirty scholarships, six schools · Stories · Exchange Club of Charleston',
    description: 'In March 2024 the Exchange Club of Charleston awarded 30 scholarships to students at six Lowcountry schools, funded by the Coastal Carolina Fair.', h1: 'Thirty scholarships, six schools' },
  { file: 'story-blue-gold-2024.html', page: 'stories', kind: 'story', date: '2024-05-09', dateLabel: 'May 9, 2024',
    title: 'Blue & Gold: honoring officers injured in the line of duty · Stories · Exchange Club of Charleston',
    description: 'At its May 9, 2024 Blue & Gold ceremony, the Exchange Club of Charleston honored three officers injured in the line of duty.', h1: 'Blue & Gold: honoring officers injured in the line of duty' },
  { file: 'story-dee-norton-2024.html', page: 'stories', kind: 'story', date: '2024-04-04', dateLabel: 'April 4, 2024',
    title: 'Dee Norton Child Advocacy Center · Stories · Exchange Club of Charleston',
    description: 'The executive director of the Dee Norton Child Advocacy Center spoke to the Exchange Club of Charleston on April 4, 2024.', h1: 'Dee Norton Child Advocacy Center' },
  { file: 'about.html', page: 'about', kind: 'interior', crumb: 'About', title: 'About · Exchange Club of Charleston',
    description: 'Organized in 1923 and chartered in 1924, the Exchange Club of Charleston is the largest Exchange Club in the nation and the organization behind the Coastal Carolina Fair.',
    h1: 'About the club', lede: 'Organized on May 10, 1923 and chartered on April 15, 1924, the Exchange Club of Charleston is the largest Exchange Club in the nation — and the organization behind the Coastal Carolina Fair.' },
  { file: 'gallery.html', page: 'gallery', kind: 'interior', crumb: 'Photo gallery', title: 'Photo gallery · Exchange Club of Charleston',
    description: 'Photos from the Coastal Carolina Fair, the Spring Festival and the Exchange Club of Charleston’s year.',
    h1: 'Photo gallery', lede: 'Scenes from the fair, the Spring Festival and the club year.' },
  { file: 'contact.html', page: 'contact', kind: 'interior', crumb: 'Contact', title: 'Contact · Exchange Club of Charleston',
    description: 'Contact the Exchange Club of Charleston about membership, the Coastal Carolina Fair, donations or media.',
    h1: 'Contact us', lede: 'Questions about the club, the fair or a gift? Send a note and it goes to the right person.' },
  { file: 'portal.html', page: 'portal', kind: 'interior', crumb: 'Member portal', title: 'Member portal · Exchange Club of Charleston',
    description: 'A preview of the Exchange Club of Charleston member portal: fair shifts, committees, dues and the roster. Demo data only.',
    h1: 'Member portal', lede: 'Members sign in to see the roster, sign up for fair shifts and check their dues.' },
  { file: 'privacy.html', page: 'privacy', kind: 'interior', crumb: 'Privacy', title: 'Privacy · Exchange Club of Charleston',
    description: 'What this demo site stores on your device (almost nothing) and what it never collects.',
    h1: 'Privacy', lede: 'This demo keeps almost nothing about you, and sends nothing anywhere.' },
  { file: '404.html', page: 'notfound', kind: 'interior', crumb: 'Page not found', title: 'Page not found · Exchange Club of Charleston',
    description: 'The page you were looking for isn’t here. Try the Exchange Club of Charleston home page.',
    h1: 'We can’t find that page', lede: 'It may have moved when the site was rebuilt.' },
];

const crumbs = (items) => `
    <nav class="breadcrumb" aria-label="Breadcrumb">
      <ol>
${items.map(([href, label]) => (href ? `        <li><a href="${href}">${esc(label)}</a></li>` : `        <li><span aria-current="page">${esc(label)}</span></li>`)).join('\n')}
      </ol>
    </nav>`;

function mainHtml(p) {
  if (p.kind === 'home') {
    return `  <section class="section">
    <div class="container">
      <h1>${esc(p.h1)}</h1>
      <p class="lede">${esc(p.lede)}</p>
    </div>
  </section>`;
  }
  if (p.kind === 'story') {
    return `  <article>
    <header class="page-hero">
      <div class="container">${crumbs([['index.html', 'Home'], ['stories.html', 'Stories'], [null, p.h1]])}
        <h1>${esc(p.h1)}</h1>
        <p class="story-meta"><time datetime="${p.date}">${p.dateLabel}</time></p>
      </div>
    </header>
  </article>`;
  }
  return `  <header class="page-hero">
    <div class="container">${crumbs([['index.html', 'Home'], [null, p.crumb]])}
      <h1>${esc(p.h1)}</h1>
      <p class="lede">${esc(p.lede)}</p>
    </div>
  </header>`;
}

for (const p of pages) {
  const url = p.file === 'index.html' ? ORIGIN : `${ORIGIN}${p.file}`;
  const html = `<!doctype html>
<html lang="en" class="no-js">
<head>
<!-- @include partials/head.html -->
<title>${esc(p.title)}</title>
<meta name="description" content="${esc(p.description)}">
<link rel="canonical" href="${url}">
<meta property="og:title" content="${esc(p.title)}">
<meta property="og:description" content="${esc(p.description)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${ORIGIN}og/og-default.png">
</head>
<body data-page="${p.page}">
<!-- @include partials/header.html -->
<main id="main" tabindex="-1">
${mainHtml(p)}
</main>
<!-- @include partials/footer.html -->
</body>
</html>
`;
  writeFileSync(p.file, html);
}
console.log(`wrote ${pages.length} pages`);
```

Run: `node /tmp/scaffold-pages.mjs && rm /tmp/scaffold-pages.mjs && ls *.html | wc -l`
Expected: `wrote 19 pages`, then `19`.

(19 files: 13 main pages incl. `404.html` and `privacy.html`, plus 6 stories. `og/og-default.png` is created in Task 15; `og:image` is an absolute URL, so check-dist does not resolve it.)

- [ ] **Step 10: Run every test**

Run: `npm test`
Expected: PASS — all suites, including `tests/main.test.js` (4 tests).

- [ ] **Step 11: Build and lint the output**

Run: `npm run build && npm run check`
Expected: `✓ 19 pages checked — no problems.`

If check-dist reports `broken internal link: /src/assets/fonts/...` for the preload links, Vite did not rewrite them: delete the two `<link rel="preload" …>` lines from `partials/head.html` and re-run (the fonts still load through the stylesheet).

- [ ] **Step 12: Visual smoke check** (dev server + Windows Chrome screenshot)

```bash
npx vite --port 5180 --strictPort >/tmp/vite.log 2>&1 &
sleep 3
"/mnt/c/Program Files/Google/Chrome/Application/chrome.exe" --headless=new --disable-gpu --hide-scrollbars --window-size=1280,900 --virtual-time-budget=4000 --screenshot='C:\Users\Anthony Quintana\projects\Exchange-Club-of-Charleston\.cache\shell-1280.png' http://localhost:5180/programs.html
"/mnt/c/Program Files/Google/Chrome/Application/chrome.exe" --headless=new --disable-gpu --hide-scrollbars --window-size=500,900 --virtual-time-budget=4000 --screenshot='C:\Users\Anthony Quintana\projects\Exchange-Club-of-Charleston\.cache\shell-500.png' http://localhost:5180/programs.html
kill %1
```

Open both PNGs (Read tool). Expected at 1280: navy utility bar with "Next meeting: …", header with the seal (ring text legible and not clipped), five nav links with "Programs" underlined in gold, Give (gold) and Join (navy) buttons; breadcrumb, H1 and lede; navy footer with four columns. At 500: Menu button visible, nav hidden, Give still visible in the bar. Fix anything that is clipped or overlapping before committing. (If `localhost:5180` is unreachable from Windows Chrome, run `npm run build && npx vite preview --port 5180 --strictPort` instead and use `http://localhost:5180/Exchange-Club-of-Charleston/programs.html`.)

- [ ] **Step 13: Commit**

```bash
git add partials src/styles src/js *.html scripts/check-dist.mjs tests
git commit -F - <<'MSG'
feat: add site shell, page files with final metadata, and post-build lint

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_019gmTqZ5kCmSQFTwxrVLfuk
MSG
```

- [ ] **Step 14: End of Part 1 — merge and push**

```bash
git checkout main && git merge --no-ff feat/demo-site -m "Merge part 1: foundation" && git push origin main && git checkout feat/demo-site
```

(The merge message must also end with the two attribution lines — use `git merge --no-ff feat/demo-site -F -` with a heredoc as in the commit steps.)
