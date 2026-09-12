# Part 1a — Foundation: scaffold and core libraries

Plan index: `../2026-09-11-exchange-club-demo.md` (read its **Global Constraints** and **Shared conventions** first).

---

### Task 1: Scaffold, partials plugin, test harness

**Files:**
- Create: `package.json`, `vite.config.js`, `plugins/html-partials.js`, `partials/head.html`, `partials/header.html`, `index.html`, `tests/partials.test.js`
- Modify: `.gitignore` (add `.cache/`)

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `applyPartials(html: string, readPartial: (name: string) => string): string` — expands `<!-- @include partials/NAME.html -->` (nested, max depth 5; throws `html-partials: includes nested too deeply`), then adds `aria-current="page"` to every `<a>` whose `data-nav` equals `<body data-page>`. A missing partial surfaces as the error thrown by `readPartial`.
  - `htmlPartials({ root: string })` — Vite plugin (`transformIndexHtml`, `order: 'pre'`), throws `html-partials: missing include "NAME"` when a partial file is absent; full-reloads the dev server when a file in `partials/` changes.
  - npm scripts: `dev`, `build`, `preview`, `test`, `test:watch`, `check` (the `check` script's file arrives in Task 4).

- [ ] **Step 1: Create the feature branch**

```bash
cd "/mnt/c/Users/Anthony Quintana/projects/Exchange-Club-of-Charleston"
git checkout -b feat/demo-site
```

- [ ] **Step 2: Create `package.json`**

```json
{
  "name": "exchange-club-of-charleston",
  "private": true,
  "version": "0.1.0",
  "description": "Unofficial redesign concept for exchangeclubofcharleston.org",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest",
    "check": "node scripts/check-dist.mjs"
  },
  "devDependencies": {
    "happy-dom": "^20.14.5",
    "vite": "^7.3.6",
    "vitest": "^4.1.11"
  }
}
```

- [ ] **Step 3: Install**

Run: `npm install`
Expected: `package-lock.json` created, no `EBADENGINE` warnings for vite/vitest/happy-dom.

- [ ] **Step 4: Add `.cache/` to `.gitignore`**

The file currently contains `node_modules/`, `dist/`, `.superpowers/`, `*.log`, `.DS_Store`, `Thumbs.db`. Append one line:

```
.cache/
```

- [ ] **Step 5: Write the failing test `tests/partials.test.js`**

```js
import { describe, it, expect } from 'vitest';
import { applyPartials } from '../plugins/html-partials.js';

const partials = {
  'partials/nav.html':
    '<nav><a href="index.html" data-nav="home">Home</a><a class="btn" href="give.html" data-nav="give">Give</a></nav>',
  'partials/outer.html': '<header><!-- @include partials/nav.html --></header>',
};
const read = (name) => {
  if (!(name in partials)) throw new Error(`html-partials: missing include "${name}"`);
  return partials[name];
};

describe('applyPartials', () => {
  it('replaces an include marker with the partial', () => {
    const out = applyPartials('<body><!-- @include partials/nav.html --></body>', read);
    expect(out).toContain('<nav><a href="index.html"');
    expect(out).not.toContain('@include');
  });

  it('expands nested includes', () => {
    const out = applyPartials('<body><!-- @include partials/outer.html --></body>', read);
    expect(out).toContain('<header><nav>');
    expect(out).not.toContain('@include');
  });

  it('marks the nav link matching body[data-page] as current', () => {
    const out = applyPartials('<body data-page="give"><!-- @include partials/nav.html --></body>', read);
    expect(out).toContain('data-nav="give" aria-current="page"');
    expect(out.match(/aria-current/g)).toHaveLength(1);
  });

  it('works when data-nav is the first attribute', () => {
    const out = applyPartials('<body data-page="x"><a data-nav="x" href="x.html">X</a></body>', () => '');
    expect(out).toContain('<a data-nav="x" aria-current="page" href="x.html">');
  });

  it('leaves links alone when the page has no data-page', () => {
    const out = applyPartials('<body><!-- @include partials/nav.html --></body>', read);
    expect(out).not.toContain('aria-current');
  });

  it('propagates a missing-include error', () => {
    expect(() => applyPartials('<!-- @include partials/nope.html -->', read)).toThrow(
      'html-partials: missing include "partials/nope.html"',
    );
  });

  it('throws when includes recurse forever', () => {
    const loop = () => '<!-- @include partials/loop.html -->';
    expect(() => applyPartials(loop(), loop)).toThrow('html-partials: includes nested too deeply');
  });
});
```

- [ ] **Step 6: Create `vite.config.js`** (needed so Vitest runs with happy-dom)

```js
import { defineConfig } from 'vite';
import { readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { htmlPartials } from './plugins/html-partials.js';

const root = import.meta.dirname;

// Every root-level .html file is a page (flat site; relative links work under any base path).
const pages = Object.fromEntries(
  readdirSync(root)
    .filter((file) => file.endsWith('.html'))
    .map((file) => [file.replace(/\.html$/, ''), resolve(root, file)]),
);

export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/Exchange-Club-of-Charleston/' : '/',
  plugins: [htmlPartials({ root })],
  build: {
    rollupOptions: { input: pages },
  },
  test: {
    environment: 'happy-dom',
    include: ['tests/**/*.test.js'],
  },
}));
```

- [ ] **Step 7: Run the test to verify it fails**

Run: `npx vitest run tests/partials.test.js`
Expected: FAIL — cannot resolve `../plugins/html-partials.js` (vite.config.js also fails to import it).

- [ ] **Step 8: Implement `plugins/html-partials.js`**

```js
import { readFileSync } from 'node:fs';
import { resolve, sep } from 'node:path';

const INCLUDE = /<!--\s*@include\s+([\w./-]+\.html)\s*-->/g;
const HAS_INCLUDE = /<!--\s*@include\s+[\w./-]+\.html\s*-->/;
const MAX_DEPTH = 5;

/**
 * Expand `<!-- @include partials/NAME.html -->` markers (nested up to MAX_DEPTH),
 * then mark the nav link whose data-nav matches <body data-page> as the current page.
 * @param {string} html
 * @param {(name: string) => string} readPartial
 * @returns {string}
 */
export function applyPartials(html, readPartial) {
  let out = html;
  for (let depth = 0; HAS_INCLUDE.test(out); depth += 1) {
    if (depth === MAX_DEPTH) throw new Error('html-partials: includes nested too deeply');
    out = out.replace(INCLUDE, (_, name) => readPartial(name));
  }
  const page = out.match(/<body\b[^>]*\bdata-page="([\w-]+)"/)?.[1];
  if (page) {
    out = out.replace(
      new RegExp(`<a\\b([^>]*?)\\bdata-nav="${page}"`, 'g'),
      `<a$1data-nav="${page}" aria-current="page"`,
    );
  }
  return out;
}

/** Vite plugin: run applyPartials on every HTML page, reading partials from `root`. */
export function htmlPartials({ root }) {
  const readPartial = (name) => {
    try {
      return readFileSync(resolve(root, name), 'utf8');
    } catch {
      throw new Error(`html-partials: missing include "${name}"`);
    }
  };
  return {
    name: 'html-partials',
    transformIndexHtml: { order: 'pre', handler: (html) => applyPartials(html, readPartial) },
    configureServer(server) {
      server.watcher.add(resolve(root, 'partials'));
      server.watcher.on('change', (file) => {
        if (file.includes(`${sep}partials${sep}`)) server.ws.send({ type: 'full-reload' });
      });
    },
  };
}
```

- [ ] **Step 9: Run the test to verify it passes**

Run: `npx vitest run tests/partials.test.js`
Expected: PASS (7 tests).

- [ ] **Step 10: Create the minimal partials and `index.html`** (Task 4 replaces these with the real shell)

`partials/head.html`:

```html
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
```

`partials/header.html`:

```html
<header><a href="index.html" data-nav="home">Exchange Club of Charleston</a></header>
```

`index.html`:

```html
<!doctype html>
<html lang="en" class="no-js">
<head>
<!-- @include partials/head.html -->
<title>Exchange Club of Charleston — Unity for Service since 1923</title>
</head>
<body data-page="home">
<!-- @include partials/header.html -->
<main id="main" tabindex="-1">
  <h1>Unity for Service, since 1923.</h1>
</main>
</body>
</html>
```

- [ ] **Step 11: Verify the build expands partials**

Run: `npm run build && grep -c 'aria-current="page"' dist/index.html && grep -c '@include' dist/index.html`
Expected: build succeeds; first grep prints `1`; second prints `0` (grep exits 1 for zero matches — that is the expected outcome).

- [ ] **Step 12: Commit**

```bash
git add package.json package-lock.json vite.config.js plugins/html-partials.js partials/ index.html tests/partials.test.js .gitignore
git commit -F - <<'MSG'
chore: scaffold Vite multi-page site with HTML partials plugin

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_019gmTqZ5kCmSQFTwxrVLfuk
MSG
```

---

### Task 2: Core libraries — dates, validation, reference IDs, ICS, storage

**Files:**
- Create: `src/data/club.js`, `src/data/meetings.js`, `src/js/lib/dates.js`, `src/js/lib/validate.js`, `src/js/lib/ref.js`, `src/js/lib/ics.js`, `src/js/lib/storage.js`
- Test: `tests/dates.test.js`, `tests/validate.test.js`, `tests/ref.test.js`, `tests/ics.test.js`, `tests/storage.test.js`

**Interfaces:**
- Consumes: nothing.
- Produces (exact names later tasks import):
  - `src/data/club.js`: `CLUB` `{ name, organized: '1923-05-10', chartered: '1924-04-15', siteUrl, meeting: { weekday, time, venue, address, mapUrl }, socials: { clubFacebook, fairFacebook } }`; `FAIR` `{ name, start, end, datesLabel, venue, address, ticketsUrl, demoUrl }`.
  - `src/data/meetings.js`: `MEETINGS: { date: 'YYYY-MM-DD', title: string, guests: boolean }[]`.
  - `dates.js`: `easternOffset(ymd) → '-04:00'|'-05:00'`; `meetingStart(ymd, time='12:00') → Date`; `easternYmd(date) → 'YYYY-MM-DD'`; `nextThursday(ymd) → 'YYYY-MM-DD'`; `upcomingMeetings(meetings, now, min=3) → { date, title, guests, tentative: boolean, start: Date }[]`; `countdownState(now, start, end) → { phase: 'before', days, hours, minutes, seconds } | { phase: 'during' } | { phase: 'after' }`; `countdownText(state) → string`; `meetingDateParts(ymd) → { month, day, weekday, short, long }`.
  - `validate.js`: `EMAIL`, `isFilled(v)`, `isEmail(v)`, `parseAmount(input) → number|NaN`, `isValidAmount(n)`, `isUsPhone(v)`, `formatUSD(n) → '$1,250'`.
  - `ref.js`: `demoRef(random = Math.random) → 'DEMO-XXXXXX'`.
  - `ics.js`: `toIcsUtc(date)`, `escapeIcs(text)`, `foldLine(line)`, `buildMeetingsIcs(meetings, place, { now, description }) → string`, `downloadIcs(filename, text, doc = document)`.
  - `storage.js`: `readJson(store, key, fallback)`, `writeJson(store, key, value) → boolean`, `removeKey(store, key)`.

- [ ] **Step 1: Create the data modules**

`src/data/club.js`:

```js
/** Facts sourced from exchangeclubofcharleston.org (crawled 2026-09-11) — see spec §7.1. */
export const CLUB = {
  name: 'Exchange Club of Charleston',
  organized: '1923-05-10',
  chartered: '1924-04-15',
  siteUrl: 'https://quinto55.github.io/Exchange-Club-of-Charleston/',
  meeting: {
    weekday: 'Thursday',
    time: '12:00 PM',
    venue: 'Charleston Rifle Club',
    address: '2221 Heriot St, Charleston, SC 29403',
    mapUrl: 'https://maps.google.com/?q=32.814137,-79.957306',
  },
  socials: {
    clubFacebook: 'https://www.facebook.com/ExchangeClubofCharlestonSC',
    fairFacebook: 'https://www.facebook.com/CoastalCarolinaFair',
  },
};

/** The 2026 Coastal Carolina Fair (club calendar: gates 3:00 PM Oct 29, close 9:00 PM Nov 8). */
export const FAIR = {
  name: 'Coastal Carolina Fair',
  start: '2026-10-29T15:00:00-04:00',
  end: '2026-11-08T21:00:00-05:00',
  datesLabel: 'Oct 29 – Nov 8, 2026',
  venue: 'Exchange Park',
  address: '9850 Highway 78, Ladson, SC 29456',
  ticketsUrl: 'https://www.coastalcarolinafair.org/p/tickets--deals',
  demoUrl: 'https://quinto55.github.io/Coastal-Carolina-Fair-/',
};
```

`src/data/meetings.js`:

```js
/** Weekly meetings listed on the club's live calendar (crawled 2026-09-11). All at noon Eastern. */
export const MEETINGS = [
  { date: '2026-09-17', title: 'Weekly Club Meeting', guests: true },
  { date: '2026-10-01', title: 'Weekly Club Meeting', guests: true },
  { date: '2026-10-08', title: 'Weekly Club Meeting', guests: true },
  { date: '2026-10-15', title: 'Weekly Club Meeting', guests: true },
  { date: '2026-11-05', title: 'Weekly Club Meeting', guests: true },
];
```

- [ ] **Step 2: Write the failing tests**

`tests/dates.test.js`:

```js
import { describe, it, expect } from 'vitest';
import {
  easternOffset,
  meetingStart,
  easternYmd,
  nextThursday,
  upcomingMeetings,
  countdownState,
  countdownText,
  meetingDateParts,
} from '../src/js/lib/dates.js';
import { MEETINGS } from '../src/data/meetings.js';
import { FAIR } from '../src/data/club.js';

describe('easternOffset', () => {
  it('uses EDT from the 2nd Sunday of March until the 1st Sunday of November', () => {
    expect(easternOffset('2026-03-07')).toBe('-05:00');
    expect(easternOffset('2026-03-08')).toBe('-04:00');
    expect(easternOffset('2026-10-31')).toBe('-04:00');
    expect(easternOffset('2026-11-01')).toBe('-05:00');
    expect(easternOffset('2026-11-05')).toBe('-05:00');
  });
});

describe('meetingStart', () => {
  it('is noon Eastern on either side of the DST change', () => {
    expect(meetingStart('2026-09-17').toISOString()).toBe('2026-09-17T16:00:00.000Z');
    expect(meetingStart('2026-11-05').toISOString()).toBe('2026-11-05T17:00:00.000Z');
  });
});

describe('easternYmd', () => {
  it('uses the Eastern calendar date, not UTC', () => {
    expect(easternYmd(new Date('2026-09-12T02:00:00Z'))).toBe('2026-09-11');
  });
});

describe('nextThursday', () => {
  it('returns the following Thursday and never the same day', () => {
    expect(nextThursday('2026-09-11')).toBe('2026-09-17');
    expect(nextThursday('2026-09-17')).toBe('2026-09-24');
  });
});

describe('upcomingMeetings', () => {
  it('drops past meetings and sorts the rest', () => {
    const list = upcomingMeetings(MEETINGS, new Date('2026-10-02T12:00:00-04:00'));
    expect(list.map((m) => m.date)).toEqual(['2026-10-08', '2026-10-15', '2026-11-05']);
    expect(list.every((m) => m.tentative === false)).toBe(true);
  });

  it('treats a meeting as past once it has started', () => {
    expect(upcomingMeetings(MEETINGS, new Date('2026-09-17T12:30:00-04:00'))[0].date).toBe('2026-10-01');
  });

  it('pads with tentative Thursdays after the last listed meeting', () => {
    const list = upcomingMeetings(MEETINGS, new Date('2026-11-01T09:00:00-05:00'));
    expect(list.map((m) => [m.date, m.tentative])).toEqual([
      ['2026-11-05', false],
      ['2026-11-12', true],
      ['2026-11-19', true],
    ]);
  });

  it('pads from today when every listed meeting is past', () => {
    const list = upcomingMeetings(MEETINGS, new Date('2027-02-01T09:00:00-05:00'));
    expect(list.map((m) => m.date)).toEqual(['2027-02-04', '2027-02-11', '2027-02-18']);
    expect(list.every((m) => m.tentative)).toBe(true);
  });

  it('returns start Dates', () => {
    expect(upcomingMeetings(MEETINGS, new Date('2026-09-11T12:00:00-04:00'))[0].start).toBeInstanceOf(Date);
  });
});

describe('countdown', () => {
  const start = new Date(FAIR.start);
  const end = new Date(FAIR.end);

  it('counts down before the fair', () => {
    const state = countdownState(new Date('2026-10-27T13:59:30-04:00'), start, end);
    expect(state).toEqual({ phase: 'before', days: 2, hours: 1, minutes: 0, seconds: 30 });
    expect(countdownText(state)).toBe('2 days · 01:00:30 until gates open');
  });

  it('uses the singular for one day', () => {
    expect(countdownText(countdownState(new Date('2026-10-28T15:00:00-04:00'), start, end))).toBe(
      '1 day · 00:00:00 until gates open',
    );
  });

  it('reports during and after', () => {
    const during = countdownState(new Date('2026-11-01T12:00:00-05:00'), start, end);
    expect(during).toEqual({ phase: 'during' });
    expect(countdownText(during)).toBe('The fair is on — through Sunday, Nov 8');
    const after = countdownState(new Date('2026-11-08T21:00:00-05:00'), start, end);
    expect(after).toEqual({ phase: 'after' });
    expect(countdownText(after)).toBe('Thanks for a great 2026 fair — 2027 dates coming soon');
  });
});

describe('meetingDateParts', () => {
  it('formats a meeting date in Eastern time', () => {
    expect(meetingDateParts('2026-09-17')).toEqual({
      month: 'SEP',
      day: '17',
      weekday: 'Thursday',
      short: 'Thu, Sep 17',
      long: 'Thursday, September 17, 2026',
    });
  });
});
```

`tests/validate.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { isFilled, isEmail, parseAmount, isValidAmount, isUsPhone, formatUSD } from '../src/js/lib/validate.js';

describe('validate', () => {
  it('isFilled trims whitespace and rejects non-strings', () => {
    expect(isFilled('  a ')).toBe(true);
    expect(isFilled('   ')).toBe(false);
    expect(isFilled(undefined)).toBe(false);
  });

  it('isEmail', () => {
    expect(isEmail('a@b.co')).toBe(true);
    expect(isEmail(' a@b.co ')).toBe(true);
    expect(isEmail('a@b')).toBe(false);
    expect(isEmail('a b@c.d')).toBe(false);
  });

  it('parseAmount accepts whole dollars with $ and commas only', () => {
    expect(parseAmount('$1,250')).toBe(1250);
    expect(parseAmount(' 75 ')).toBe(75);
    expect(parseAmount('12.50')).toBeNaN();
    expect(parseAmount('')).toBeNaN();
    expect(parseAmount('-5')).toBeNaN();
  });

  it('isValidAmount enforces $5 – $100,000', () => {
    expect(isValidAmount(5)).toBe(true);
    expect(isValidAmount(100000)).toBe(true);
    expect(isValidAmount(4)).toBe(false);
    expect(isValidAmount(100001)).toBe(false);
    expect(isValidAmount(Number.NaN)).toBe(false);
  });

  it('isUsPhone accepts 10 digits or 11 starting with 1', () => {
    expect(isUsPhone('(843) 555-0142')).toBe(true);
    expect(isUsPhone('1-843-555-0142')).toBe(true);
    expect(isUsPhone('555-0142')).toBe(false);
    expect(isUsPhone('2-843-555-0142')).toBe(false);
  });

  it('formatUSD has no cents', () => {
    expect(formatUSD(1250)).toBe('$1,250');
    expect(formatUSD(50)).toBe('$50');
  });
});
```

`tests/ref.test.js`:

```js
import { it, expect } from 'vitest';
import { demoRef } from '../src/js/lib/ref.js';

it('is DEMO- plus six unambiguous characters', () => {
  expect(demoRef()).toMatch(/^DEMO-[A-HJ-NP-Z2-9]{6}$/);
});

it('uses the supplied random source', () => {
  expect(demoRef(() => 0)).toBe('DEMO-AAAAAA');
  expect(demoRef(() => 0.9999)).toBe('DEMO-999999');
});
```

`tests/ics.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { buildMeetingsIcs, toIcsUtc, escapeIcs, foldLine } from '../src/js/lib/ics.js';
import { CLUB } from '../src/data/club.js';

const now = new Date('2026-09-11T20:00:00Z');
const meeting = (date) => ({ date, title: 'Weekly Club Meeting' });

describe('ics', () => {
  it('formats UTC timestamps', () => {
    expect(toIcsUtc(new Date('2026-09-17T16:00:00Z'))).toBe('20260917T160000Z');
  });

  it('escapes text values', () => {
    expect(escapeIcs('a, b; c\\d\ne')).toBe('a\\, b\\; c\\\\d\\ne');
  });

  it('builds one VEVENT per meeting with a one-hour noon slot', () => {
    const ics = buildMeetingsIcs([meeting('2026-09-17'), meeting('2026-11-05')], CLUB.meeting, { now });
    expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(2);
    expect(ics).toContain('DTSTART:20260917T160000Z');
    expect(ics).toContain('DTEND:20260917T170000Z');
    expect(ics).toContain('DTSTART:20261105T170000Z');
    expect(ics).toContain('DTSTAMP:20260911T200000Z');
    expect(ics).toContain('UID:2026-09-17-weekly-meeting@exchangeclubofcharleston.demo');
    expect(ics.startsWith('BEGIN:VCALENDAR\r\nVERSION:2.0\r\n')).toBe(true);
    expect(ics.endsWith('END:VCALENDAR\r\n')).toBe(true);
  });

  it('escapes the location and folds every line to 75 octets', () => {
    const ics = buildMeetingsIcs([meeting('2026-09-17')], CLUB.meeting, { now });
    expect(ics.replace(/\r\n /g, '')).toContain(
      'LOCATION:Charleston Rifle Club\\, 2221 Heriot St\\, Charleston\\, SC 29403',
    );
    for (const line of ics.split('\r\n')) {
      expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75);
    }
  });

  it('foldLine leaves short lines alone', () => {
    expect(foldLine('SUMMARY:Hi')).toBe('SUMMARY:Hi');
  });
});
```

`tests/storage.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { readJson, writeJson, removeKey } from '../src/js/lib/storage.js';

const memory = () => {
  const map = new Map();
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: (k) => map.delete(k),
  };
};
const broken = {
  getItem() { throw new Error('denied'); },
  setItem() { throw new Error('denied'); },
  removeItem() { throw new Error('denied'); },
};

describe('storage', () => {
  it('round-trips JSON', () => {
    const store = memory();
    expect(writeJson(store, 'k', { a: 1 })).toBe(true);
    expect(readJson(store, 'k', null)).toEqual({ a: 1 });
  });

  it('returns the fallback for missing or invalid values', () => {
    const store = memory();
    expect(readJson(store, 'none', 'fb')).toBe('fb');
    store.setItem('bad', '{');
    expect(readJson(store, 'bad', 'fb')).toBe('fb');
  });

  it('survives a store that throws', () => {
    expect(readJson(broken, 'k', 'fb')).toBe('fb');
    expect(writeJson(broken, 'k', 1)).toBe(false);
    expect(() => removeKey(broken, 'k')).not.toThrow();
  });

  it('removes keys', () => {
    const store = memory();
    writeJson(store, 'k', 1);
    removeKey(store, 'k');
    expect(readJson(store, 'k', null)).toBeNull();
  });
});
```

- [ ] **Step 3: Run the tests to verify they fail**

Run: `npx vitest run tests/dates.test.js tests/validate.test.js tests/ref.test.js tests/ics.test.js tests/storage.test.js`
Expected: FAIL — the five `src/js/lib/*.js` modules do not exist.

- [ ] **Step 4: Implement the libraries**

`src/js/lib/dates.js`:

```js
const DAY_MS = 86_400_000;
const TZ = 'America/New_York';

/** UTC-midnight timestamp for a 'YYYY-MM-DD' string. */
function ymdToUtc(ymd) {
  const [y, m, d] = ymd.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
}

function addDays(ymd, days) {
  return new Date(ymdToUtc(ymd) + days * DAY_MS).toISOString().slice(0, 10);
}

/** UTC-midnight timestamp of the nth given weekday (0 = Sunday) of a month. */
function nthWeekday(year, monthIndex, weekday, n) {
  const firstDow = new Date(Date.UTC(year, monthIndex, 1)).getUTCDay();
  return Date.UTC(year, monthIndex, 1 + ((weekday - firstDow + 7) % 7) + (n - 1) * 7);
}

/** Eastern UTC offset on a calendar date (US DST: 2nd Sunday of March to 1st Sunday of November). */
export function easternOffset(ymd) {
  const year = Number(ymd.slice(0, 4));
  const t = ymdToUtc(ymd);
  return t >= nthWeekday(year, 2, 0, 2) && t < nthWeekday(year, 10, 0, 1) ? '-04:00' : '-05:00';
}

/** A meeting's start instant: local time (default noon) Eastern on the given date. */
export function meetingStart(ymd, time = '12:00') {
  return new Date(`${ymd}T${time}:00${easternOffset(ymd)}`);
}

/** Eastern calendar date of an instant, as 'YYYY-MM-DD'. */
export function easternYmd(date) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
}

/** First Thursday strictly after the given date. */
export function nextThursday(ymd) {
  const dow = new Date(ymdToUtc(ymd)).getUTCDay();
  return addDays(ymd, (4 - dow + 7) % 7 || 7);
}

/**
 * Meetings that start after `now`, soonest first. When fewer than `min` remain, pads with
 * generated Thursday-noon meetings (tentative: true) after the later of the last listed
 * meeting and today, so the list is never empty.
 */
export function upcomingMeetings(meetings, now, min = 3) {
  const list = meetings
    .map((m) => ({ ...m, tentative: false, start: meetingStart(m.date) }))
    .filter((m) => m.start > now)
    .sort((a, b) => a.start - b.start);
  let cursor = [meetings.map((m) => m.date).sort().at(-1), easternYmd(now)].filter(Boolean).sort().at(-1);
  while (list.length < min) {
    cursor = nextThursday(cursor);
    const start = meetingStart(cursor);
    if (start > now) list.push({ date: cursor, title: 'Weekly Club Meeting', guests: true, tentative: true, start });
  }
  return list;
}

/** Countdown phase relative to the fair's start and end instants. */
export function countdownState(now, start, end) {
  if (now < start) {
    let s = Math.floor((start - now) / 1000);
    const days = Math.floor(s / 86_400);
    s -= days * 86_400;
    const hours = Math.floor(s / 3_600);
    s -= hours * 3_600;
    const minutes = Math.floor(s / 60);
    return { phase: 'before', days, hours, minutes, seconds: s - minutes * 60 };
  }
  return now < end ? { phase: 'during' } : { phase: 'after' };
}

export function countdownText(state) {
  if (state.phase === 'during') return 'The fair is on — through Sunday, Nov 8';
  if (state.phase === 'after') return 'Thanks for a great 2026 fair — 2027 dates coming soon';
  const pad = (n) => String(n).padStart(2, '0');
  const days = `${state.days} ${state.days === 1 ? 'day' : 'days'}`;
  return `${days} · ${pad(state.hours)}:${pad(state.minutes)}:${pad(state.seconds)} until gates open`;
}

/** Display parts for a meeting date, formatted in Eastern time. */
export function meetingDateParts(ymd) {
  const d = meetingStart(ymd);
  const f = (opts) => new Intl.DateTimeFormat('en-US', { timeZone: TZ, ...opts }).format(d);
  return {
    month: f({ month: 'short' }).toUpperCase(),
    day: f({ day: 'numeric' }),
    weekday: f({ weekday: 'long' }),
    short: f({ weekday: 'short', month: 'short', day: 'numeric' }),
    long: f({ weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }),
  };
}
```

`src/js/lib/validate.js`:

```js
export const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const isFilled = (v) => typeof v === 'string' && v.trim().length > 0;

export const isEmail = (v) => typeof v === 'string' && EMAIL.test(v.trim());

/** Whole-dollar amount from input like "$1,250"; NaN unless it is a whole, non-negative number. */
export function parseAmount(input) {
  const cleaned = String(input ?? '').replace(/[$,\s]/g, '');
  return /^\d+$/.test(cleaned) ? Number(cleaned) : Number.NaN;
}

export const isValidAmount = (n) => Number.isInteger(n) && n >= 5 && n <= 100_000;

/** US phone: 10 digits, or 11 starting with 1, after removing every non-digit. */
export function isUsPhone(v) {
  const digits = String(v ?? '').replace(/\D/g, '');
  return digits.length === 10 || (digits.length === 11 && digits.startsWith('1'));
}

const usd = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export const formatUSD = (n) => usd.format(n);
```

`src/js/lib/ref.js`:

```js
// No I, O, 0 or 1 — references are read aloud and retyped.
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/** Demo confirmation reference, e.g. DEMO-7KQ2MX. */
export function demoRef(random = Math.random) {
  let s = '';
  for (let i = 0; i < 6; i += 1) s += ALPHABET[Math.floor(random() * ALPHABET.length)];
  return `DEMO-${s}`;
}
```

`src/js/lib/ics.js`:

```js
import { meetingStart } from './dates.js';

const CRLF = '\r\n';
const pad = (n) => String(n).padStart(2, '0');
const encoder = new TextEncoder();

export function toIcsUtc(date) {
  return (
    `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}` +
    `T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`
  );
}

export function escapeIcs(text) {
  return String(text)
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

/** RFC 5545 folding: lines longer than 75 octets continue on lines starting with one space. */
export function foldLine(line) {
  if (encoder.encode(line).length <= 75) return line;
  const parts = [];
  let current = '';
  let bytes = 0;
  let limit = 75;
  for (const ch of line) {
    const size = encoder.encode(ch).length;
    if (bytes + size > limit) {
      parts.push(current);
      current = '';
      bytes = 0;
      limit = 74; // continuation lines spend one octet on the leading space
    }
    current += ch;
    bytes += size;
  }
  parts.push(current);
  return parts.join(`${CRLF} `);
}

/**
 * Calendar file for weekly meetings (one-hour events at noon Eastern, written in UTC).
 * @param {{date: string, title: string}[]} meetings
 * @param {{venue: string, address: string}} place
 */
export function buildMeetingsIcs(
  meetings,
  place,
  { now = new Date(), description = 'Weekly lunch meeting of the Exchange Club of Charleston. Guests welcome.' } = {},
) {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Exchange Club of Charleston//Demo site//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ];
  for (const m of meetings) {
    const start = meetingStart(m.date);
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    lines.push(
      'BEGIN:VEVENT',
      `UID:${m.date}-weekly-meeting@exchangeclubofcharleston.demo`,
      `DTSTAMP:${toIcsUtc(now)}`,
      `DTSTART:${toIcsUtc(start)}`,
      `DTEND:${toIcsUtc(end)}`,
      `SUMMARY:${escapeIcs(`Exchange Club of Charleston — ${m.title}`)}`,
      `LOCATION:${escapeIcs(`${place.venue}, ${place.address}`)}`,
      `DESCRIPTION:${escapeIcs(description)}`,
      'END:VEVENT',
    );
  }
  lines.push('END:VCALENDAR');
  return lines.map(foldLine).join(CRLF) + CRLF;
}

/** Download text as an .ics file (browser only; nothing leaves the device). */
export function downloadIcs(filename, text, doc = document) {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/calendar;charset=utf-8' }));
  const a = doc.createElement('a');
  a.href = url;
  a.download = filename;
  doc.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
```

`src/js/lib/storage.js`:

```js
/** JSON helpers that never throw (private mode, blocked storage, bad JSON all fall back). */
export function readJson(store, key, fallback) {
  try {
    const raw = store?.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function writeJson(store, key, value) {
  try {
    store?.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function removeKey(store, key) {
  try {
    store?.removeItem(key);
  } catch {
    /* storage unavailable: nothing to remove */
  }
}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npm test`
Expected: PASS — partials (7), dates (12), validate (6), ref (2), ics (5), storage (4).

- [ ] **Step 6: Commit**

```bash
git add src/data src/js/lib tests
git commit -F - <<'MSG'
feat: add date, validation, reference, ICS and storage libraries

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_019gmTqZ5kCmSQFTwxrVLfuk
MSG
```
