# Part 4 — Ship

Plan index: `../2026-09-11-exchange-club-demo.md` (read its **Global Constraints** and **Shared conventions** first).

The GitHub Pages deploy workflow already exists (added at the end of Part 1 by controller Ruling 7), so every merge to `main` publishes a preview at `https://quinto55.github.io/Exchange-Club-of-Charleston/`.

---

### Task 15: Privacy, 404, robots, sitemap, structured data, OG image

**Files:**
- Modify: `privacy.html`, `404.html` (sections after the page-hero), every root `*.html` (JSON-LD block written by script), `src/styles/pages.css` (append the Privacy block)
- Create: `public/robots.txt`, `public/sitemap.xml`, `scripts/structured-data.mjs`, `scripts/og.html`, `public/og/og-default.png` (rendered)
- Test: `tests/structured-data.test.js`, `tests/og-image.test.js`

**Interfaces:**
- Consumes: `CLUB`, `FAIR`, `MEETINGS`, `easternOffset` (Task 2), `STORIES` (Task 9), `PORTAL_SESSION_KEY`, `PORTAL_STATE_KEY` values `ecc.portal` / `ecc.portal.state` (Task 14).
- Produces: `scripts/structured-data.mjs` exports `ngo()`, `festival()`, `meetingEvents(meetings)`, `breadcrumb(trail)`, `pageJsonLd(file) → object[]`, `injectJsonLd(html, objects) → string`; running it writes `<!-- jsonld --><script type="application/ld+json">…</script><!-- /jsonld -->` into each page head (idempotent).

- [ ] **Step 1: Write the failing tests**

`tests/structured-data.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { ngo, festival, meetingEvents, breadcrumb, pageJsonLd, injectJsonLd } from '../scripts/structured-data.mjs';

const root = resolve(import.meta.dirname, '..');
const pages = readdirSync(root).filter((f) => f.endsWith('.html'));
const types = (file) => pageJsonLd(file).map((o) => o['@type']);

describe('structured data', () => {
  it('describes the club as an NGO founded in 1923', () => {
    expect(ngo()).toMatchObject({ '@type': 'NGO', name: 'Exchange Club of Charleston', foundingDate: '1923-05-10', url: 'https://quinto55.github.io/Exchange-Club-of-Charleston/' });
  });

  it('describes the 2026 fair with Exchange Park and the official ticket page', () => {
    const fair = festival();
    expect(fair).toMatchObject({ '@type': 'Festival', startDate: '2026-10-29T15:00:00-04:00', endDate: '2026-11-08T21:00:00-05:00' });
    expect(fair.location.address.postalCode).toBe('29456');
    expect(fair.offers.url).toBe('https://www.coastalcarolinafair.org/p/tickets--deals');
  });

  it('writes one-hour noon meetings with the right Eastern offset', () => {
    const events = meetingEvents([{ date: '2026-09-17', title: 'Weekly Club Meeting' }, { date: '2026-11-05', title: 'Weekly Club Meeting' }]);
    expect(events.map((e) => [e.startDate, e.endDate])).toEqual([
      ['2026-09-17T12:00:00-04:00', '2026-09-17T13:00:00-04:00'],
      ['2026-11-05T12:00:00-05:00', '2026-11-05T13:00:00-05:00'],
    ]);
  });

  it('numbers breadcrumb items from 1 with absolute URLs', () => {
    expect(breadcrumb([['Home', 'index.html'], ['Give', 'give.html']]).itemListElement).toEqual([
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://quinto55.github.io/Exchange-Club-of-Charleston/' },
      { '@type': 'ListItem', position: 2, name: 'Give', item: 'https://quinto55.github.io/Exchange-Club-of-Charleston/give.html' },
    ]);
  });

  it('chooses the right objects per page', () => {
    expect(types('index.html')).toEqual(['NGO']);
    expect(types('about.html')).toEqual(['NGO', 'BreadcrumbList']);
    expect(types('fair.html')).toEqual(['Festival', 'BreadcrumbList']);
    expect(types('meetings.html')).toEqual(['Event', 'Event', 'Event', 'Event', 'Event', 'BreadcrumbList']);
    expect(types('story-blue-gold-2024.html')).toEqual(['BreadcrumbList']);
    expect(pageJsonLd('story-blue-gold-2024.html')[0].itemListElement[2].name).toBe('Blue & Gold: honoring officers injured in the line of duty');
    expect(types('404.html')).toEqual([]);
  });

  it('injects idempotently and escapes "<"', () => {
    const html = '<html><head><title>x</title></head><body></body></html>';
    const once = injectJsonLd(html, [{ name: 'a<b' }]);
    expect(once).toContain('<!-- jsonld --><script type="application/ld+json">{"name":"a\\u003cb"}</script><!-- /jsonld -->\n</head>');
    expect(injectJsonLd(once, [{ name: 'a<b' }])).toBe(once);
    expect(injectJsonLd(once, [{ name: 'c' }])).toContain('{"name":"c"}');
    expect(injectJsonLd(html, [])).toBe(html);
  });

  it.each(pages)('%s carries up-to-date JSON-LD', (file) => {
    const html = readFileSync(resolve(root, file), 'utf8');
    expect(html).toBe(injectJsonLd(html, pageJsonLd(file)));
    for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) expect(() => JSON.parse(m[1])).not.toThrow();
  });
});
```

`tests/og-image.test.js`:

```js
import { it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

it('ships a 1200×630 PNG share image', () => {
  const png = readFileSync(resolve(import.meta.dirname, '../public/og/og-default.png'));
  expect(png.subarray(1, 4).toString('ascii')).toBe('PNG');
  expect(png.readUInt32BE(16)).toBe(1200);
  expect(png.readUInt32BE(20)).toBe(630);
});
```

- [ ] **Step 2: Run them to verify they fail**

Run: `npx vitest run tests/structured-data.test.js tests/og-image.test.js`
Expected: FAIL — `scripts/structured-data.mjs` and `public/og/og-default.png` do not exist.

- [ ] **Step 3: Implement `scripts/structured-data.mjs`**

```js
#!/usr/bin/env node
// Writes schema.org JSON-LD into every page head, between <!-- jsonld --> markers. Idempotent.
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { CLUB, FAIR } from '../src/data/club.js';
import { MEETINGS } from '../src/data/meetings.js';
import { STORIES } from '../src/data/stories.js';
import { easternOffset } from '../src/js/lib/dates.js';

const ORIGIN = CLUB.siteUrl;
const url = (file) => (file === 'index.html' ? ORIGIN : `${ORIGIN}${file}`);
const CONTEXT = 'https://schema.org';
const ORGANIZER = { '@type': 'NGO', name: CLUB.name, url: ORIGIN };
const address = (streetAddress, addressLocality, postalCode) => ({
  '@type': 'PostalAddress', streetAddress, addressLocality, addressRegion: 'SC', postalCode, addressCountry: 'US',
});

const PAGE_NAMES = {
  'fair.html': 'The Fair',
  'programs.html': 'Programs of Service',
  'give.html': 'Give',
  'join.html': 'Join',
  'meetings.html': 'Meetings & events',
  'stories.html': 'Stories',
  'about.html': 'About',
  'gallery.html': 'Photo gallery',
  'contact.html': 'Contact',
  'portal.html': 'Member portal',
  'privacy.html': 'Privacy',
};

export const ngo = () => ({
  '@context': CONTEXT,
  '@type': 'NGO',
  name: CLUB.name,
  url: ORIGIN,
  logo: `${ORIGIN}og/og-default.png`,
  foundingDate: CLUB.organized,
  description: 'Charleston member club of the National Exchange Club and owner-operator of the Coastal Carolina Fair.',
  sameAs: [CLUB.socials.clubFacebook],
});

export const festival = () => ({
  '@context': CONTEXT,
  '@type': 'Festival',
  name: 'Coastal Carolina Fair 2026',
  startDate: FAIR.start,
  endDate: FAIR.end,
  eventStatus: 'https://schema.org/EventScheduled',
  eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
  location: { '@type': 'Place', name: FAIR.venue, address: address('9850 Highway 78', 'Ladson', '29456') },
  organizer: ORGANIZER,
  offers: { '@type': 'Offer', url: FAIR.ticketsUrl },
  url: url('fair.html'),
});

export const meetingEvents = (meetings = MEETINGS) =>
  meetings.map((m) => {
    const offset = easternOffset(m.date);
    return {
      '@context': CONTEXT,
      '@type': 'Event',
      name: `${CLUB.name} — ${m.title}`,
      startDate: `${m.date}T12:00:00${offset}`,
      endDate: `${m.date}T13:00:00${offset}`,
      eventStatus: 'https://schema.org/EventScheduled',
      eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
      location: { '@type': 'Place', name: CLUB.meeting.venue, address: address('2221 Heriot St', 'Charleston', '29403') },
      organizer: ORGANIZER,
      url: url('meetings.html'),
    };
  });

export const breadcrumb = (trail) => ({
  '@context': CONTEXT,
  '@type': 'BreadcrumbList',
  itemListElement: trail.map(([name, file], i) => ({ '@type': 'ListItem', position: i + 1, name, item: url(file) })),
});

export function pageJsonLd(file) {
  if (file === 'index.html') return [ngo()];
  const story = STORIES.find((s) => `${s.slug}.html` === file);
  if (story) return [breadcrumb([['Home', 'index.html'], ['Stories', 'stories.html'], [story.title, file]])];
  if (!PAGE_NAMES[file]) return [];
  const crumb = breadcrumb([['Home', 'index.html'], [PAGE_NAMES[file], file]]);
  if (file === 'about.html') return [ngo(), crumb];
  if (file === 'fair.html') return [festival(), crumb];
  if (file === 'meetings.html') return [...meetingEvents(), crumb];
  return [crumb];
}

const MARKERS = /<!-- jsonld -->[\s\S]*?<!-- \/jsonld -->/;

export function injectJsonLd(html, objects) {
  const payload = objects.length === 1 ? objects[0] : objects;
  const block = objects.length
    ? `<!-- jsonld --><script type="application/ld+json">${JSON.stringify(payload).replace(/</g, '\\u003c')}</script><!-- /jsonld -->`
    : '';
  if (MARKERS.test(html)) return html.replace(MARKERS, () => block);
  return block ? html.replace('</head>', () => `${block}\n</head>`) : html;
}

function main() {
  const root = resolve(import.meta.dirname, '..');
  const files = readdirSync(root).filter((f) => f.endsWith('.html'));
  for (const file of files) {
    const path = resolve(root, file);
    writeFileSync(path, injectJsonLd(readFileSync(path, 'utf8'), pageJsonLd(file)));
  }
  console.log(`structured data written to ${files.length} pages`);
}

if (process.argv[1] && resolve(process.argv[1]) === import.meta.filename) main();
```

- [ ] **Step 4: Write the structured data into the pages**

Run: `node scripts/structured-data.mjs && node scripts/structured-data.mjs && git diff --stat -- '*.html' | tail -1`
Expected: `structured data written to 19 pages` twice; the second run changes nothing (the diff stat is the same as after the first run).

- [ ] **Step 5: Create `scripts/og.html` and render the share image**

`scripts/og.html`:

```html
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Exchange Club of Charleston — share image</title>
<style>
  @font-face { font-family: 'Libre Caslon Display'; src: url('../src/assets/fonts/libre-caslon-display-400.woff2') format('woff2'); }
  @font-face { font-family: 'Public Sans'; src: url('../src/assets/fonts/public-sans-var.woff2') format('woff2'); font-weight: 400 700; }
  html, body { margin: 0; width: 1200px; height: 630px; overflow: hidden; }
  body {
    box-sizing: border-box; display: grid; grid-template-columns: 300px 1fr; align-items: center; gap: 64px; padding: 0 84px;
    background: #1B2A6B; color: #F7F4EC; font-family: 'Public Sans', system-ui, sans-serif;
  }
  .seal { width: 300px; height: 300px; }
  .name { margin: 0; color: #FFFFFF; font: 400 86px/1.02 'Libre Caslon Display', Georgia, serif; }
  .line { margin: 26px 0 0; color: #E6E9F3; font-size: 34px; font-weight: 600; }
  .rule { width: 120px; height: 4px; margin: 34px 0 22px; background: #C9A227; }
  .fair { margin: 0; color: #C9A227; font-size: 22px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; }
</style>
</head>
<body>
  <svg class="seal" viewBox="0 0 120 120" aria-hidden="true">
    <defs><path id="ring" d="M60 60m-46 0a46 46 0 1 1 92 0a46 46 0 1 1-92 0"/></defs>
    <circle cx="60" cy="60" r="59" fill="#111A45"/>
    <circle cx="60" cy="60" r="55" fill="none" stroke="#C9A227" stroke-width="1.5"/>
    <circle cx="60" cy="60" r="36" fill="none" stroke="#C9A227" stroke-width="1"/>
    <text fill="#F7F4EC" font-family="Public Sans, sans-serif" font-size="7.4" font-weight="700" letter-spacing="1"><textPath href="#ring" textLength="284" lengthAdjust="spacing">UNITY FOR SERVICE · EXCHANGE CLUB OF CHARLESTON · 1923 ·</textPath></text>
    <path d="M47 44a9 9 0 1 0 8.2 12.6a7.2 7.2 0 1 1-8.2-12.6z" fill="#C9A227"/>
    <path d="M61 86c-.9-9-.2-18 1.2-27" fill="none" stroke="#C9A227" stroke-width="3.4" stroke-linecap="round"/>
    <g fill="none" stroke="#C9A227" stroke-width="2.4" stroke-linecap="round">
      <path d="M62.2 58c-5.6-5.8-12.4-6.6-18-3.4"/><path d="M62.2 58c-3.6-7-3.6-12.6 0-17.6"/><path d="M62.2 58c3.6-7 9.2-9.8 15.4-9"/>
      <path d="M62.2 58c6.4-3.6 12.6-2.8 17.4 2"/><path d="M62.2 58c-7.4-1.4-12.8 1.8-15.6 7.6"/><path d="M62.2 58c7.4-.6 12.2 2.8 14.2 8.4"/>
    </g>
  </svg>
  <div>
    <p class="name">Exchange Club<br>of Charleston</p>
    <p class="line">Unity for Service, since 1923.</p>
    <div class="rule"></div>
    <p class="fair">The club behind the Coastal Carolina Fair</p>
  </div>
</body>
</html>
```

(`scripts/og.html` is not a site page; hex colours are fine here — the CSS token test only scans `src/styles/`.)

```bash
mkdir -p public/og
"/mnt/c/Program Files/Google/Chrome/Application/chrome.exe" --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=1 \
  --window-size=1200,630 --virtual-time-budget=3000 \
  --screenshot='C:\Users\Anthony Quintana\projects\Exchange-Club-of-Charleston\public\og\og-default.png' \
  'file:///C:/Users/Anthony%20Quintana/projects/Exchange-Club-of-Charleston/scripts/og.html'
```

Read `public/og/og-default.png` (Read tool): expect the seal on the left, the name in Caslon, a gold rule, the gold fair line — nothing clipped.

- [ ] **Step 6: Create `public/robots.txt` and `public/sitemap.xml`**

`public/robots.txt`:

```
# Demo concept for the Exchange Club of Charleston — not the official site.
# At real launch, delete this Disallow and the noindex meta in partials/head.html.
User-agent: *
Disallow: /
```

`public/sitemap.xml` — one `<url><loc>…</loc></url>` per page except `404.html`, absolute URLs, index as the bare origin:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://quinto55.github.io/Exchange-Club-of-Charleston/</loc></url>
  <url><loc>https://quinto55.github.io/Exchange-Club-of-Charleston/fair.html</loc></url>
  <url><loc>https://quinto55.github.io/Exchange-Club-of-Charleston/programs.html</loc></url>
  <url><loc>https://quinto55.github.io/Exchange-Club-of-Charleston/give.html</loc></url>
  <url><loc>https://quinto55.github.io/Exchange-Club-of-Charleston/join.html</loc></url>
  <url><loc>https://quinto55.github.io/Exchange-Club-of-Charleston/meetings.html</loc></url>
  <url><loc>https://quinto55.github.io/Exchange-Club-of-Charleston/stories.html</loc></url>
  <url><loc>https://quinto55.github.io/Exchange-Club-of-Charleston/story-fair-workday-2026.html</loc></url>
  <url><loc>https://quinto55.github.io/Exchange-Club-of-Charleston/story-spring-festival-2026.html</loc></url>
  <url><loc>https://quinto55.github.io/Exchange-Club-of-Charleston/story-fair-appreciation-2026.html</loc></url>
  <url><loc>https://quinto55.github.io/Exchange-Club-of-Charleston/story-blue-gold-2024.html</loc></url>
  <url><loc>https://quinto55.github.io/Exchange-Club-of-Charleston/story-dee-norton-2024.html</loc></url>
  <url><loc>https://quinto55.github.io/Exchange-Club-of-Charleston/story-scholarships-2024.html</loc></url>
  <url><loc>https://quinto55.github.io/Exchange-Club-of-Charleston/about.html</loc></url>
  <url><loc>https://quinto55.github.io/Exchange-Club-of-Charleston/gallery.html</loc></url>
  <url><loc>https://quinto55.github.io/Exchange-Club-of-Charleston/contact.html</loc></url>
  <url><loc>https://quinto55.github.io/Exchange-Club-of-Charleston/portal.html</loc></url>
  <url><loc>https://quinto55.github.io/Exchange-Club-of-Charleston/privacy.html</loc></url>
</urlset>
```

- [ ] **Step 7: Write the Privacy and 404 content**

`privacy.html` — after the page-hero `</header>`, inside `<main>`:

```html
  <section class="section">
    <div class="container prose">
      <h2>What this demo collects</h2>
      <p>Nothing. The site sets no cookies and loads no analytics, advertising or tracking scripts. Every form in this demo — giving, RSVP, the membership application and contact — runs only in your browser and sends nothing anywhere.</p>
      <h2>What it keeps on your device</h2>
      <ul>
        <li><code>ecc.portal</code> in session storage remembers that you opened the member-portal preview. It clears when you close the tab.</li>
        <li><code>ecc.portal.state</code> in local storage keeps your demo shift and committee choices. “Reset demo” in the portal clears it.</li>
      </ul>
      <h2>Photos from the club’s albums</h2>
      <p>Gallery and story photos load from the club’s photo storage at <code>clubrunner.blob.core.windows.net</code>. Like any image host, it receives your IP address and browser details when it serves them.</p>
      <h2>At launch</h2>
      <p>This page describes the demo only. A live site would replace it with the club’s own privacy policy.</p>
    </div>
  </section>
```

`404.html` — after the page-hero `</header>`, inside `<main>`:

```html
  <section class="section">
    <div class="container">
      <h2>Try one of these</h2>
      <nav class="jump-nav" aria-label="Popular pages">
        <ul>
          <li><a href="index.html">Home</a></li>
          <li><a href="fair.html">The Coastal Carolina Fair</a></li>
          <li><a href="meetings.html">Meetings</a></li>
          <li><a href="give.html">Give</a></li>
          <li><a href="contact.html">Contact</a></li>
        </ul>
      </nav>
    </div>
  </section>
```

Append the Privacy block to `src/styles/pages.css`:

```css
/* ---------- Privacy ---------- */
.prose code { padding: 0.1em 0.35em; background: var(--navy-tint); border-radius: 4px; font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 0.9em; }
```

- [ ] **Step 8: Run the tests, then the gates**

Run: `npx vitest run tests/structured-data.test.js tests/og-image.test.js && npm test && npm run build && npm run check && ls dist/robots.txt dist/sitemap.xml dist/og/og-default.png`
Expected: both suites PASS; full suite PASS; check-dist clean; the three public files are in `dist/`.

- [ ] **Step 9: Commit**

```bash
git add privacy.html 404.html *.html src/styles/pages.css public scripts/structured-data.mjs scripts/og.html tests/structured-data.test.js tests/og-image.test.js
git commit -F - <<'MSG'
feat: add privacy and 404 pages, structured data, sitemap and share image

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_019gmTqZ5kCmSQFTwxrVLfuk
MSG
```

---

### Task 16: README, audit map, overflow QA, final deploy

**Files:**
- Create: `README.md`, `docs/AUDIT-MAP.md`, `scripts/qa-overflow.html`
- Modify: any file needed to fix what the QA step finds (record each fix in the report)

**Interfaces:**
- Consumes: everything built so far; the deploy workflow `.github/workflows/deploy.yml` (Ruling 7).
- Produces: the pitch sheet (`docs/AUDIT-MAP.md`), the README, and a verified live deployment.

- [ ] **Step 1: Write `docs/AUDIT-MAP.md`**

```markdown
# Audit map — every finding, and where the demo fixes it

Findings are from `docs/AUDIT.md` (live site, 2026-09-11). Pages are in the repo root; the live demo is
https://quinto55.github.io/Exchange-Club-of-Charleston/.

| № | Finding | Severity | What the demo does instead | Where |
| --- | --- | --- | --- | --- |
| 1 | Donate buttons go nowhere | Broken | Three-step giving flow: fund, amount, one-time or monthly, dedication, review and a demo receipt | `give.html` |
| 2 | Donate page is platform sample content | Broken | Real causes: scholarships, child-abuse prevention, fair community grants | `give.html`, `src/data/funds.js` |
| 3 | Five buttons open google.com | Broken | Every action goes to a real page; the build fails on any google.com placeholder | all pages, `scripts/check-dist.mjs` |
| 4 | Community Service menu item is a 404 | Broken | Full Community Service section with giving and joining links | `programs.html#community-service` |
| 5 | News cards have no pictures | Broken | Club photos stored with the site as responsive WebP | `index.html`, `stories.html` |
| 6 | Facebook feeds never load | Broken | No embeds; clear links to both Facebook pages | footer, `contact.html` |
| 7 | YouTube icon goes to the vendor’s channel | Broken | Removed; only the club’s own channels are linked | footer |
| 8 | “Blue &amp;amp; Gold” shows raw code | Polish | Text written correctly; the build fails on double-encoding | all pages, `scripts/check-dist.mjs` |
| 9 | Homepage doesn’t sell the fair | Costly | Fair card in the hero: 2026 dates, live countdown, ticket button | `index.html` |
| 10 | Fair page shows 2025 dates | Broken | 2026 dates from one data source; a test forbids 2025 dates | `fair.html`, `src/data/club.js`, `tests/fair.test.js` |
| 11 | News stopped in spring 2024 | Costly | Stories led by three 2026 posts from the club’s own albums | `index.html`, `stories.html` |
| 12 | Triple B page still sells April 2025 | Costly | Festival card with “2027 dates: club to confirm”; typos gone | `fair.html` |
| 13 | Food Court page is stale, with placeholders | Polish | Current Food Court card, no placeholder captions | `fair.html` |
| 14 | “COVENENT” in the biggest headline | Polish | The Covenant set as a plaque and spelled correctly; a test guards the spelling | `about.html#covenant` |
| 15 | Become a Member has no way to join | Costly | What membership involves, FAQ and a two-step application | `join.html` |
| 16 | Contact goes to one officer; directory is login-only | Costly | Topic-routed contact form that goes to roles, not people; leadership listed by role | `contact.html`, `about.html` |
| 17 | Photo albums use raw folder names, unsorted | Polish | Curated albums with readable, dated titles | `gallery.html` |
| 18 | Upcoming Events breaks out of the grid | Polish | Meetings as place cards inside the page grid | `index.html`, `meetings.html` |
| 19 | Duplicate menu items | Polish | Five-item navigation plus Give and Join, no duplicates | `partials/header.html` |
| 20 | Members Only in the public menu | Polish | A clearly labeled member-portal preview in the utility bar | `portal.html` |
| 21 | DONATE hidden on phones | Costly | Give stays in the header bar at every width | `partials/header.html`, `src/styles/shell.css` |
| 22 | Vendor links in the footer | Polish | Footer carries only the club’s own links | `partials/footer.html` |
| 23 | One-slide carousel with arrows | Polish | No carousel — one composed hero | `index.html` |
| 24 | Hero is a stretched Facebook cover | Costly | Real 1980-px club photo served at 480/960/1600 px | `index.html` |
| 25 | Template lime green | Polish | Navy and gold from the club emblem; colour tokens enforced by a test | `src/styles/tokens.css`, `tests/css-tokens.test.js` |
| 26 | Neon Covenant box | Polish | Paper plaque with gold rules | `about.html` |
| 27 | Headings don’t match | Polish | One type system: Libre Caslon and Public Sans on a fixed scale | `src/styles/base.css` |
| 28 | Looks like every ClubRunner site | Polish | Original seal, Covenant plaque, meeting place cards, fair ticket stub | `partials/seal.html`, `src/styles/components.css` |
| 29 | Clip-art food truck | Polish | Real Exchange Park photography | `fair.html` |
| 30 | Plain-text event list | Polish | Place cards with date blocks and consistent times | `index.html`, `meetings.html` |
| 31 | Cookie banner covers the hero | Polish | No cookies or trackers, so no consent banner is needed | `privacy.html` |
| 32 | Green text fails contrast | Costly | Every text/background pair meets WCAG AA | `src/styles/tokens.css` |
| 33 | Images lack alt text | Costly | Every image has alt text or is marked decorative; the build checks alt and dimensions | all pages, `scripts/check-dist.mjs` |
| 34 | Heading structure is broken | Costly | One non-empty h1 per page and no skipped levels, enforced at build | all pages, `scripts/check-dist.mjs` |
| 35 | Vague and duplicated links | Polish | Descriptive link text, one link per card | all pages |
| 36 | No descriptions or share previews | Costly | Unique title, description and Open Graph/Twitter card on every page | all pages |
| 37 | Homepage title is “Home Page” | Costly | “Exchange Club of Charleston — Unity for Service since 1923” | `index.html` |
| 38 | Key facts exist only inside images | Costly | Dates, tickets and history are real text; JSON-LD for the club, the fair and every meeting | `index.html`, `fair.html`, `meetings.html` |
| 39 | Sitemap is stale and messy | Polish | Clean sitemap of every page | `public/sitemap.xml` |
| 40 | robots.txt is cluttered | Polish | Short robots.txt (the demo disallows indexing until launch) | `public/robots.txt` |
| 41 | www serves a duplicate site | Polish | Canonical URL on every page (the www redirect is a DNS setting at launch) | all pages |
| 42 | The logo weighs 773 KB | Costly | Emblem served at 160/320 px WebP, under 20 KB | footer, `src/assets/img/` |
| 43 | Script stack from another decade | Polish | Zero runtime dependencies; a few small ES modules | `src/js/` |
| 44 | Assets aren’t cached | Polish | Content-hashed asset filenames, safe to cache for a year (cache headers are a host setting at launch) | `dist/assets/` |
```

- [ ] **Step 2: Write `README.md`**

```markdown
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
```

- [ ] **Step 3: Create `scripts/qa-overflow.html`** (dev-only harness; not a site page — it lives outside the build inputs)

```html
<!doctype html>
<meta charset="utf-8">
<title>Overflow QA</title>
<pre id="out">running…</pre>
<script type="module">
  const pages = ['index', 'fair', 'programs', 'give', 'join', 'meetings', 'stories',
    'story-fair-workday-2026', 'story-spring-festival-2026', 'story-fair-appreciation-2026',
    'story-scholarships-2024', 'story-blue-gold-2024', 'story-dee-norton-2024',
    'about', 'gallery', 'contact', 'portal', 'privacy', '404'];
  const widths = [360, 768, 1280];
  const lines = [];
  for (const width of widths) {
    for (const page of pages) {
      const frame = document.createElement('iframe');
      frame.style.cssText = `position:absolute;left:-99999px;width:${width}px;height:900px;border:0`;
      frame.src = `/${page}.html`;
      document.body.append(frame);
      await new Promise((resolve) => { frame.onload = resolve; });
      await new Promise((resolve) => setTimeout(resolve, 400));
      const over = frame.contentDocument.documentElement.scrollWidth - frame.contentWindow.innerWidth;
      lines.push(`${over > 1 ? 'FAIL' : 'ok  '} ${String(width).padStart(4)} ${page}${over > 1 ? ` (+${over}px)` : ''}`);
      frame.remove();
    }
  }
  document.getElementById('out').textContent = `${lines.join('\n')}\nDONE`;
</script>
```

- [ ] **Step 4: Run the overflow QA and fix every FAIL**

```bash
npx vite --port 5182 --strictPort >/tmp/vite-qa.log 2>&1 &
sleep 4
"/mnt/c/Program Files/Google/Chrome/Application/chrome.exe" --headless=new --disable-gpu --virtual-time-budget=120000 --dump-dom http://localhost:5182/scripts/qa-overflow.html > .cache/qa-overflow.txt
kill %1
grep -E 'FAIL|DONE' .cache/qa-overflow.txt
```

Expected: `DONE` and no `FAIL` lines. For each FAIL, find the element wider than the viewport (open the page at that width and look for long URLs, fixed widths, wide grids or absolutely positioned elements), fix it in CSS, and re-run until clean. (If localhost is unreachable from Windows Chrome, run the same harness in the Vite preview of a build is not possible — it is not a build input — so report BLOCKED with the log instead of skipping.)

- [ ] **Step 5: Screenshot review** — with the dev server running, capture `index`, `fair`, `programs`, `give`, `meetings`, `portal` at 1280 and `index`, `give`, `portal` at 500 (Task 5 Step 7 commands, dev URL `http://localhost:5182/<page>.html`). Read each PNG. Fix anything clipped, overlapping, unreadable or misaligned; note each fix in the report.

- [ ] **Step 6: Final gates**

Run: `npm test && npm run build && npm run check`
Expected: all pass.

- [ ] **Step 7: Commit**

```bash
git add README.md docs/AUDIT-MAP.md scripts/qa-overflow.html
git add -u
git commit -F - <<'MSG'
docs: add README and audit map; fix layout issues found in QA

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_019gmTqZ5kCmSQFTwxrVLfuk
MSG
```

- [ ] **Step 8: Merge, push and verify the live deployment**

```bash
git checkout main && git merge --no-ff feat/demo-site -F - <<'MSG' && git push origin main && git checkout feat/demo-site
Merge part 4: ship

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_019gmTqZ5kCmSQFTwxrVLfuk
MSG
sleep 20
gh run list --workflow deploy.yml --limit 1
gh run watch "$(gh run list --workflow deploy.yml --limit 1 --json databaseId --jq '.[0].databaseId')" --exit-status
curl -s -o /dev/null -w "%{http_code}\n" https://quinto55.github.io/Exchange-Club-of-Charleston/
curl -s -o /dev/null -w "%{http_code}\n" https://quinto55.github.io/Exchange-Club-of-Charleston/give.html
```

Expected: the run concludes `success`; both URLs return `200`.
