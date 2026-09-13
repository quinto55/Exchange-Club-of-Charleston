# Part 2 — Content pages

Plan index: `../2026-09-11-exchange-club-demo.md` (read its **Global Constraints** and **Shared conventions** first).

Every task in this part edits an existing page generated in Task 4: keep the `<head>` exactly as generated, keep the `page-hero` header the generator wrote (unless the task says to replace it), and put new sections after it inside `<main>`. Photos use the **Responsive photo** snippet from the plan index with the `NAME`, `ALT` and `SIZES` given here. Run `npm test && npm run build && npm run check` before every commit.

---

### Task 5: Home page

**Files:**
- Modify: `index.html` (replace everything inside `<main>`)
- Modify: `src/styles/components.css` (two small additions), `src/styles/pages.css` (append the Home block)
- Test: `tests/home.test.js`

**Interfaces:**
- Consumes: `meetingCardHtml` (Task 4) — the three static meeting cards must equal its output; hooks `[data-countdown]` and `ul[data-meeting-list]` (Task 4 `main.js`); photo files `hero-members`, `program-child-abuse`, `program-americanism`, `program-youth`, `program-community`, `story-workday`, `story-cadets`, `story-appreciation`, `fair-logo-120/240` (Task 3).
- Produces: `.card-list` (list reset, in components.css), `.cta-band__panel--navy h3` colour rule, `.home-hero*` classes.

- [ ] **Step 1: Write the failing test `tests/home.test.js`**

```js
import { describe, it, expect, beforeAll } from 'vitest';
import { loadPage } from './helpers/load-page.js';
import { meetingCardHtml } from '../src/js/lib/meeting-cards.js';

const hrefs = (selector) => [...document.querySelectorAll(selector)].map((a) => a.getAttribute('href'));

describe('home page', () => {
  beforeAll(() => loadPage('index.html'));

  it('leads with the hero line and two actions', () => {
    expect(document.querySelector('h1').textContent).toBe('Unity for Service, since 1923.');
    expect(hrefs('.home-hero .btn')).toEqual(['meetings.html#rsvp', 'give.html']);
  });

  it('sells the fair with dates, a live countdown hook and the official ticket link', () => {
    const card = document.querySelector('.fair-card');
    expect(card.querySelector('.fair-card__dates').textContent).toBe('Oct 29 – Nov 8, 2026');
    expect(card.querySelector('[data-countdown]')).not.toBeNull();
    expect(card.querySelector('.ticket-btn').getAttribute('href')).toBe('https://www.coastalcarolinafair.org/p/tickets--deals');
    expect(card.querySelector('.fair-card__link').getAttribute('href')).toBe('fair.html');
  });

  it('shows four impact figures with a source line', () => {
    const figures = [...document.querySelectorAll('.impact__figure')].map((el) => el.textContent);
    expect(figures).toEqual(['$11M+', '$504K+', '~$50K', '15,000+']);
    expect(document.querySelector('.impact__source')).not.toBeNull();
  });

  it('links the four programs to their anchors', () => {
    expect(hrefs('section[aria-labelledby="programs-title"] .card__link')).toEqual([
      'programs.html#child-abuse-prevention',
      'programs.html#americanism',
      'programs.html#youth',
      'programs.html#community-service',
    ]);
  });

  it('ships three static meeting cards identical to the renderer output', () => {
    const list = document.querySelector('ul[data-meeting-list]');
    const expected = ['2026-09-17', '2026-10-01', '2026-10-08']
      .map((date) => meetingCardHtml({ date, title: 'Weekly Club Meeting', tentative: false }))
      .join('');
    expect(list.innerHTML.replace(/>\s+</g, '><').trim()).toBe(expected);
  });

  it('features the three 2026 stories, newest first', () => {
    expect(hrefs('section[aria-labelledby="latest-title"] .card__link')).toEqual([
      'story-fair-workday-2026.html',
      'story-spring-festival-2026.html',
      'story-fair-appreciation-2026.html',
    ]);
  });

  it('quotes the Covenant and links to it', () => {
    expect(document.querySelector('.pullquote blockquote').textContent).toContain('To serve in Unity');
    expect(hrefs('.pullquote a')).toEqual(['about.html#covenant']);
  });

  it('closes with Join and Give', () => {
    expect(hrefs('.cta-band .btn')).toEqual(['join.html', 'give.html']);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run tests/home.test.js`
Expected: FAIL — `.home-hero .btn` finds nothing (the stub home page has no hero).

- [ ] **Step 3: Replace the contents of `<main>` in `index.html`**

```html
  <section class="home-hero">
    <div class="container home-hero__inner">
      <div class="home-hero__text">
        <p class="eyebrow">The Exchange Club of Charleston · Est. 1923</p>
        <h1>Unity for Service, since 1923.</h1>
        <p class="lede">We’re a member club of the National Exchange Club — and the volunteers who run the Coastal Carolina Fair. What the fair raises comes back to the Lowcountry as scholarships, community grants and child-abuse prevention.</p>
        <div class="btn-row">
          <a class="btn btn--primary" href="meetings.html#rsvp">Visit a Thursday lunch</a>
          <a class="btn btn--give" href="give.html">Give</a>
        </div>
      </div>
      <div class="home-hero__media">
        <figure class="photo home-hero__photo">
          <img src="/src/assets/img/hero-members-960.webp"
               srcset="/src/assets/img/hero-members-480.webp 480w, /src/assets/img/hero-members-960.webp 960w, /src/assets/img/hero-members-1600.webp 1600w"
               sizes="(min-width: 900px) 45vw, 100vw" width="1600" height="1067" fetchpriority="high" decoding="async"
               alt="Two club members in Coastal Carolina Fair shirts share a laugh at the 2026 Spring Festival">
          <figcaption>Members at the 2026 Spring Festival.</figcaption>
        </figure>
        <aside class="fair-card home-hero__fair" aria-labelledby="fair-card-title">
          <img class="fair-card__logo" src="/src/assets/img/fair-logo-120.webp" srcset="/src/assets/img/fair-logo-120.webp 1x, /src/assets/img/fair-logo-240.webp 2x" width="120" height="123" decoding="async" alt="Coastal Carolina Fair">
          <p class="fair-card__eyebrow">Our flagship fundraiser</p>
          <h2 class="fair-card__title" id="fair-card-title">Coastal Carolina Fair</h2>
          <p class="fair-card__dates">Oct 29 – Nov 8, 2026</p>
          <p class="fair-card__place">Exchange Park · Ladson, SC</p>
          <p class="fair-card__countdown" data-countdown>Gates open Thursday, Oct 29 at 3:00 PM</p>
          <div class="fair-card__actions">
            <a class="ticket-btn" href="https://www.coastalcarolinafair.org/p/tickets--deals" rel="noopener">Get tickets <span class="ticket-btn__stub" aria-hidden="true">→</span></a>
            <a class="fair-card__link" href="fair.html">About the fair</a>
          </div>
        </aside>
      </div>
    </div>
  </section>

  <section class="section section--navy" aria-labelledby="impact-title">
    <div class="container">
      <div class="section-head">
        <p class="eyebrow">What the fair makes possible</p>
        <h2 id="impact-title">What the fair gives back</h2>
      </div>
      <ul class="impact">
        <li class="impact__item"><span class="impact__figure">$11M+</span><span class="impact__label">returned to the Lowcountry since 2003</span></li>
        <li class="impact__item"><span class="impact__figure">$504K+</span><span class="impact__label">granted to 90+ local nonprofits and students after the latest fair</span></li>
        <li class="impact__item"><span class="impact__figure">~$50K</span><span class="impact__label">set aside for scholarships every year</span></li>
        <li class="impact__item"><span class="impact__figure">15,000+</span><span class="impact__label">volunteer hours given in 2023</span></li>
      </ul>
      <p class="impact__source">Figures published by the Coastal Carolina Fair and on the club’s Youth Programs page.</p>
    </div>
  </section>

  <section class="section" aria-labelledby="programs-title">
    <div class="container">
      <div class="section-head">
        <p class="eyebrow">Programs of Service</p>
        <h2 id="programs-title">Four ways we serve</h2>
      </div>
      <ul class="grid grid--4 card-list">
        <li class="card">
          <div class="card__media"><img src="/src/assets/img/program-child-abuse-960.webp" srcset="/src/assets/img/program-child-abuse-480.webp 480w, /src/assets/img/program-child-abuse-960.webp 960w, /src/assets/img/program-child-abuse-1600.webp 1600w" sizes="(min-width: 1100px) 25vw, (min-width: 600px) 50vw, 100vw" width="1600" height="1067" loading="lazy" decoding="async" alt="Club members with the executive director of the Dee Norton Child Advocacy Center"></div>
          <div class="card__body">
            <h3 class="card__title"><a class="card__link" href="programs.html#child-abuse-prevention">Prevention of Child Abuse</a></h3>
            <p>Exchange’s national project since 1979. Locally, we back the Dee Norton Child Advocacy Center and Compass Harbor.</p>
          </div>
        </li>
        <li class="card">
          <div class="card__media"><img src="/src/assets/img/program-americanism-960.webp" srcset="/src/assets/img/program-americanism-480.webp 480w, /src/assets/img/program-americanism-960.webp 960w, /src/assets/img/program-americanism-1600.webp 1600w" sizes="(min-width: 1100px) 25vw, (min-width: 600px) 50vw, 100vw" width="1600" height="1067" loading="lazy" decoding="async" alt="A U.S. Marine is honored at the club’s National Defense luncheon"></div>
          <div class="card__body">
            <h3 class="card__title"><a class="card__link" href="programs.html#americanism">Americanism</a></h3>
            <p>Freedom Shrines, flags for kids, and yearly honors for our military and for officers injured in the line of duty.</p>
          </div>
        </li>
        <li class="card">
          <div class="card__media"><img src="/src/assets/img/program-youth-960.webp" srcset="/src/assets/img/program-youth-480.webp 480w, /src/assets/img/program-youth-960.webp 960w, /src/assets/img/program-youth-1600.webp 1600w" sizes="(min-width: 1100px) 25vw, (min-width: 600px) 50vw, 100vw" width="1600" height="1067" loading="lazy" decoding="async" alt="A scholarship recipient receives her award from the club president"></div>
          <div class="card__body">
            <h3 class="card__title"><a class="card__link" href="programs.html#youth">Youth &amp; Scholarships</a></h3>
            <p>About $50,000 a year in scholarships, plus Youth of the Year, A.C.E. and Young Citizenship awards.</p>
          </div>
        </li>
        <li class="card">
          <div class="card__media"><img src="/src/assets/img/program-community-960.webp" srcset="/src/assets/img/program-community-480.webp 480w, /src/assets/img/program-community-960.webp 960w, /src/assets/img/program-community-1600.webp 1600w" sizes="(min-width: 1100px) 25vw, (min-width: 600px) 50vw, 100vw" width="1600" height="1067" loading="lazy" decoding="async" alt="Members in red fair shirts volunteering at the 2026 Spring Festival"></div>
          <div class="card__body">
            <h3 class="card__title"><a class="card__link" href="programs.html#community-service">Community Service</a></h3>
            <p>Fair proceeds become grants for local nonprofits — and our members show up to do the work.</p>
          </div>
        </li>
      </ul>
    </div>
  </section>

  <section class="section section--tint" aria-labelledby="meet-title">
    <div class="container split">
      <div class="section-head">
        <p class="eyebrow">Guests welcome</p>
        <h2 id="meet-title">Meet us on Thursday</h2>
        <p class="lede">Lunch is at noon every Thursday at the Charleston Rifle Club, with a guest speaker on something that matters to Charleston.</p>
        <p><a href="https://maps.google.com/?q=32.814137,-79.957306" rel="noopener">2221 Heriot St, Charleston, SC 29403</a></p>
        <div class="btn-row">
          <a class="btn btn--primary" href="meetings.html#rsvp">Reserve a guest seat</a>
          <a class="btn btn--secondary" href="meetings.html">All meetings</a>
        </div>
      </div>
      <ul class="place-list" data-meeting-list data-limit="3">
        <li class="place-card"><p class="place-card__date" aria-hidden="true"><span class="place-card__month">SEP</span><span class="place-card__day">17</span></p><div class="place-card__body"><p class="place-card__title">Weekly Club Meeting</p><p class="place-card__meta"><time datetime="2026-09-17T12:00">Thursday, September 17, 2026</time> · 12:00 PM</p><p class="place-card__meta">Charleston Rifle Club</p><span class="place-card__tag">Guests welcome</span></div><a class="btn btn--secondary place-card__action" href="meetings.html#rsvp">Reserve a seat<span class="visually-hidden"> for Thursday, September 17, 2026</span></a></li>
        <li class="place-card"><p class="place-card__date" aria-hidden="true"><span class="place-card__month">OCT</span><span class="place-card__day">1</span></p><div class="place-card__body"><p class="place-card__title">Weekly Club Meeting</p><p class="place-card__meta"><time datetime="2026-10-01T12:00">Thursday, October 1, 2026</time> · 12:00 PM</p><p class="place-card__meta">Charleston Rifle Club</p><span class="place-card__tag">Guests welcome</span></div><a class="btn btn--secondary place-card__action" href="meetings.html#rsvp">Reserve a seat<span class="visually-hidden"> for Thursday, October 1, 2026</span></a></li>
        <li class="place-card"><p class="place-card__date" aria-hidden="true"><span class="place-card__month">OCT</span><span class="place-card__day">8</span></p><div class="place-card__body"><p class="place-card__title">Weekly Club Meeting</p><p class="place-card__meta"><time datetime="2026-10-08T12:00">Thursday, October 8, 2026</time> · 12:00 PM</p><p class="place-card__meta">Charleston Rifle Club</p><span class="place-card__tag">Guests welcome</span></div><a class="btn btn--secondary place-card__action" href="meetings.html#rsvp">Reserve a seat<span class="visually-hidden"> for Thursday, October 8, 2026</span></a></li>
      </ul>
    </div>
  </section>

  <section class="section" aria-labelledby="latest-title">
    <div class="container">
      <div class="section-head">
        <p class="eyebrow">Stories</p>
        <h2 id="latest-title">Latest from the club</h2>
      </div>
      <ul class="grid grid--3 card-list">
        <li class="card">
          <div class="card__media"><img src="/src/assets/img/story-workday-960.webp" srcset="/src/assets/img/story-workday-480.webp 480w, /src/assets/img/story-workday-960.webp 960w, /src/assets/img/story-workday-1600.webp 1600w" sizes="(min-width: 760px) 33vw, 100vw" width="1600" height="1067" loading="lazy" decoding="async" alt="Members with buckets and tools at the June 6, 2026 fair workday at Exchange Park"></div>
          <div class="card__body">
            <p class="card__meta"><time datetime="2026-06-06">June 6, 2026</time></p>
            <h3 class="card__title"><a class="card__link" href="story-fair-workday-2026.html">Fair workday at Exchange Park</a></h3>
            <p>Members spent a Saturday at Exchange Park getting the grounds ready for the fall fair.</p>
          </div>
        </li>
        <li class="card">
          <div class="card__media"><img src="/src/assets/img/story-cadets-960.webp" srcset="/src/assets/img/story-cadets-480.webp 480w, /src/assets/img/story-cadets-960.webp 960w, /src/assets/img/story-cadets-1600.webp 1600w" sizes="(min-width: 760px) 33vw, 100vw" width="1600" height="1067" loading="lazy" decoding="async" alt="Citadel cadets volunteering at the 2026 Spring Festival"></div>
          <div class="card__body">
            <p class="card__meta"><time datetime="2026-04">April 2026</time></p>
            <h3 class="card__title"><a class="card__link" href="story-spring-festival-2026.html">Spring Festival 2026</a></h3>
            <p>Rides, a rodeo and a charro show at Exchange Park — with members and Citadel cadets working the grounds.</p>
          </div>
        </li>
        <li class="card">
          <div class="card__media"><img src="/src/assets/img/story-appreciation-960.webp" srcset="/src/assets/img/story-appreciation-480.webp 480w, /src/assets/img/story-appreciation-960.webp 960w, /src/assets/img/story-appreciation-1600.webp 1600w" sizes="(min-width: 760px) 33vw, 100vw" width="1600" height="1067" loading="lazy" decoding="async" alt="The hall set for the 2026 Fair Appreciation Party"></div>
          <div class="card__body">
            <p class="card__meta"><time datetime="2026-01-17">January 17, 2026</time></p>
            <h3 class="card__title"><a class="card__link" href="story-fair-appreciation-2026.html">2026 Fair Appreciation Party</a></h3>
            <p>An evening for the people behind the 2025 Coastal Carolina Fair.</p>
          </div>
        </li>
      </ul>
      <p><a href="stories.html">All stories</a></p>
    </div>
  </section>

  <section class="section section--tint" aria-labelledby="covenant-line">
    <div class="container">
      <figure class="pullquote">
        <h2 class="visually-hidden" id="covenant-line">From the Exchange Covenant</h2>
        <blockquote><p>“To serve in Unity with those seeking better conditions, better understandings, and greater opportunities for all.”</p></blockquote>
        <figcaption>From the Exchange Covenant · <a href="about.html#covenant">Read it in full</a></figcaption>
      </figure>
    </div>
  </section>

  <section class="section" aria-labelledby="cta-title">
    <div class="container">
      <h2 class="visually-hidden" id="cta-title">Get involved</h2>
      <div class="cta-band">
        <div class="cta-band__panel cta-band__panel--navy">
          <p class="eyebrow">Membership</p>
          <h3>Become an Exchangite</h3>
          <p>Leadership, friendship and a hand in everything the fair makes possible.</p>
          <a class="btn btn--give" href="join.html">Start your application</a>
        </div>
        <div class="cta-band__panel">
          <p class="eyebrow">Give</p>
          <h3>Give where it counts</h3>
          <p>Fund a scholarship, a child-abuse prevention program or a community grant.</p>
          <a class="btn btn--primary" href="give.html">Make a gift</a>
        </div>
      </div>
    </div>
  </section>
```

- [ ] **Step 4: Add the shared rules to `src/styles/components.css`**

Append after the `.card__more` rule:

```css
.card-list { margin: 0; padding: 0; list-style: none; }
```

Change the selector `.cta-band__panel--navy h2 { color: var(--paper); }` to:

```css
.cta-band__panel--navy h2, .cta-band__panel--navy h3 { color: var(--paper); }
```

- [ ] **Step 5: Append the Home block to `src/styles/pages.css`**

```css
/* ---------- Home ---------- */
.home-hero { padding-block: clamp(var(--space-6), 6vw, var(--space-8)); }
.home-hero__inner { display: grid; align-items: center; gap: var(--space-7); }
.home-hero__text { display: grid; gap: var(--space-5); }
.home-hero__text .lede { font-size: 1.25rem; }
.home-hero__media { position: relative; display: grid; gap: var(--space-5); }
@media (min-width: 900px) {
  .home-hero__inner { grid-template-columns: 1.05fr 1fr; }
  .home-hero__media { padding-bottom: var(--space-9); }
  .home-hero__photo figcaption { max-width: 42%; }
  .home-hero__fair { position: absolute; right: calc(-1 * var(--space-4)); bottom: 0; width: min(20rem, 72%); }
}
```

- [ ] **Step 6: Run the test to verify it passes, then the gates**

Run: `npx vitest run tests/home.test.js && npm test && npm run build && npm run check`
Expected: home suite PASS (8 tests); full suite PASS; `✓ 19 pages checked — no problems.`

- [ ] **Step 7: Screenshot check** (build + preview, then Windows Chrome)

```bash
npm run build && (npx vite preview --port 5181 --strictPort >/tmp/preview.log 2>&1 &) && sleep 3
for w in 1280 390; do "/mnt/c/Program Files/Google/Chrome/Application/chrome.exe" --headless=new --disable-gpu --hide-scrollbars --window-size=$w,3600 --virtual-time-budget=5000 --screenshot="C:\\Users\\Anthony Quintana\\projects\\Exchange-Club-of-Charleston\\.cache\\home-$w.png" http://localhost:5181/Exchange-Club-of-Charleston/; done
pkill -f "vite preview --port 5181"
```

Read both PNGs. Expected at 1280: hero text left, photo right with the fair card overlapping its lower right (not covering the caption), navy impact band, four program cards in one row, tint meeting section with three place cards, three story cards, pull quote, two CTA panels. At 390 (Chrome's minimum window may render wider — judge stacking, not width): everything stacks; no text clipped. Fix clipping/overlap before committing.

- [ ] **Step 8: Commit**

```bash
git add index.html src/styles/components.css src/styles/pages.css tests/home.test.js
git commit -F - <<'MSG'
feat: build the home page

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_019gmTqZ5kCmSQFTwxrVLfuk
MSG
```

---

### Task 6: The Fair page

**Files:**
- Modify: `fair.html` (replace everything inside `<main>`, including the generated page-hero)
- Modify: `src/styles/pages.css` (append The Fair block)
- Test: `tests/fair.test.js`

**Interfaces:**
- Consumes: `.fair-hero*`, `.ticket-btn`, `.timeline*`, `.card*`, `.club-note` (Task 3); `[data-countdown]` hook (Task 4); photos `fair-night`, `fair-opening`, `festival-rodeo`, `fairgrounds-day`.
- Produces: nothing other tasks depend on.

- [ ] **Step 1: Write the failing test `tests/fair.test.js`**

```js
import { describe, it, expect, beforeAll } from 'vitest';
import { loadPage } from './helpers/load-page.js';

describe('fair page', () => {
  beforeAll(() => loadPage('fair.html'));

  it('opens with the fair hero: 2026 dates, place, countdown and tickets', () => {
    const hero = document.querySelector('.fair-hero');
    expect(hero.querySelector('h1').textContent).toBe('The Coastal Carolina Fair');
    expect(hero.querySelector('.fair-hero__dates').textContent).toBe('Oct 29 – Nov 8, 2026');
    expect(hero.querySelector('.fair-hero__place').textContent).toContain('9850 Highway 78, Ladson, SC 29456');
    expect(hero.querySelector('[data-countdown]')).not.toBeNull();
    expect(hero.querySelector('.ticket-btn').getAttribute('href')).toBe('https://www.coastalcarolinafair.org/p/tickets--deals');
    expect(hero.querySelector('a[href="https://quinto55.github.io/Coastal-Carolina-Fair-/"]')).not.toBeNull();
  });

  it('never shows 2025 dates', () => {
    expect(document.querySelector('main').textContent).not.toMatch(/Oct(ober)? 30|Nov(ember)? 9\b/);
  });

  it('tells the history from 1922 to 2026', () => {
    const years = [...document.querySelectorAll('.timeline__year')].map((el) => el.textContent);
    expect(years).toEqual(['1922', '1924', '1925', '1930', '1942', '1957', '1979', '2026']);
  });

  it('lists the other fundraisers with club-to-confirm notes', () => {
    const titles = [...document.querySelectorAll('section[aria-labelledby="more-title"] .card__title')].map((el) => el.textContent);
    expect(titles).toEqual(['Family Festival & Triple B Cowboy Challenge', 'Exchange Park Food Court']);
    expect(document.querySelectorAll('section[aria-labelledby="more-title"] .club-note')).toHaveLength(2);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run tests/fair.test.js`
Expected: FAIL — no `.fair-hero` on the stub page.

- [ ] **Step 3: Replace the contents of `<main>` in `fair.html`**

```html
  <section class="fair-hero" aria-labelledby="fair-title">
    <div class="fair-hero__bg">
      <img src="/src/assets/img/fair-night-960.webp" srcset="/src/assets/img/fair-night-480.webp 480w, /src/assets/img/fair-night-960.webp 960w, /src/assets/img/fair-night-1600.webp 1600w" sizes="100vw" width="1600" height="1067" fetchpriority="high" decoding="async" alt="">
    </div>
    <div class="container">
      <div class="fair-hero__inner">
        <nav class="breadcrumb" aria-label="Breadcrumb">
          <ol>
            <li><a href="index.html">Home</a></li>
            <li><span aria-current="page">The Fair</span></li>
          </ol>
        </nav>
        <p class="eyebrow">Our flagship fundraiser · since 1957</p>
        <h1 id="fair-title">The Coastal Carolina Fair</h1>
        <p class="fair-hero__dates">Oct 29 – Nov 8, 2026</p>
        <p class="fair-hero__place">Exchange Park · 9850 Highway 78, Ladson, SC 29456</p>
        <p class="fair-hero__countdown" data-countdown>Gates open Thursday, Oct 29 at 3:00 PM</p>
        <div class="btn-row">
          <a class="ticket-btn" href="https://www.coastalcarolinafair.org/p/tickets--deals" rel="noopener">Get tickets <span class="ticket-btn__stub" aria-hidden="true">→</span></a>
          <a href="https://quinto55.github.io/Coastal-Carolina-Fair-/" rel="noopener">Preview the fair site redesign</a>
        </div>
      </div>
    </div>
  </section>

  <section class="section" aria-labelledby="money-title">
    <div class="container split">
      <div class="prose">
        <p class="eyebrow">Where the money goes</p>
        <h2 id="money-title">Eleven days that fund a year of service</h2>
        <p>The fair is the Exchange Club of Charleston’s engine for giving. Members run it as volunteers, and what it raises comes back to the Lowcountry as grants to local nonprofits, scholarships for local students and support for child-abuse prevention.</p>
        <p>After the latest fair, more than $504,000 went to over 90 local nonprofits and students. Since 2003 the fair has returned more than $11 million to the Lowcountry.</p>
        <p><a class="btn btn--primary" href="programs.html">See the programs it funds</a></p>
      </div>
      <figure class="photo">
        <img src="/src/assets/img/fair-opening-960.webp" srcset="/src/assets/img/fair-opening-480.webp 480w, /src/assets/img/fair-opening-960.webp 960w, /src/assets/img/fair-opening-1600.webp 1600w" sizes="(min-width: 900px) 50vw, 100vw" width="1600" height="1067" loading="lazy" decoding="async" alt="Members cut the ribbon to open the 2025 Coastal Carolina Fair">
        <figcaption>Opening day, 2025.</figcaption>
      </figure>
    </div>
  </section>

  <section class="section section--tint" aria-labelledby="history-title">
    <div class="container">
      <div class="section-head">
        <p class="eyebrow">History</p>
        <h2 id="history-title">A fair since 1922</h2>
      </div>
      <ol class="timeline">
        <li class="timeline__item"><span class="timeline__year">1922</span><p class="timeline__text">The Charleston County fair opens at College Park on Rutledge Avenue.</p></li>
        <li class="timeline__item"><span class="timeline__year">1924</span><p class="timeline__text">The fair moves to the grounds of the Charleston Rifle Club.</p></li>
        <li class="timeline__item"><span class="timeline__year">1925</span><p class="timeline__text">Five years on Marion Square, using the old Citadel building next door.</p></li>
        <li class="timeline__item"><span class="timeline__year">1930</span><p class="timeline__text">The Charleston Agricultural and Industrial Fair opens on the grounds around Johnson Hagood Stadium.</p></li>
        <li class="timeline__item"><span class="timeline__year">1942</span><p class="timeline__text">No full fair during World War II — poultry and pigeon shows carry on through 1944.</p></li>
        <li class="timeline__item"><span class="timeline__year">1957</span><p class="timeline__text">The Exchange Club of Charleston takes ownership of the fair.</p></li>
        <li class="timeline__item"><span class="timeline__year">1979</span><p class="timeline__text">The fair settles at Exchange Park in Ladson — more than 180 acres.</p></li>
        <li class="timeline__item"><span class="timeline__year">2026</span><p class="timeline__text">October 29 – November 8: the next fair.</p></li>
      </ol>
    </div>
  </section>

  <section class="section" aria-labelledby="more-title">
    <div class="container">
      <div class="section-head">
        <p class="eyebrow">More fundraisers</p>
        <h2 id="more-title">Exchange Park all year</h2>
      </div>
      <div class="grid grid--2">
        <article class="card">
          <div class="card__media"><img src="/src/assets/img/festival-rodeo-960.webp" srcset="/src/assets/img/festival-rodeo-480.webp 480w, /src/assets/img/festival-rodeo-960.webp 960w, /src/assets/img/festival-rodeo-1600.webp 1600w" sizes="(min-width: 760px) 50vw, 100vw" width="1600" height="1067" loading="lazy" decoding="async" alt="A rider gallops across the arena at the 2026 Spring Festival"></div>
          <div class="card__body">
            <h3 class="card__title">Family Festival &amp; Triple B Cowboy Challenge</h3>
            <p>Each spring, Exchange Park fills with carnival rides and a professional rodeo — bronc riding, bull riding and barrel racing.</p>
            <p class="club-note">2027 dates: club to confirm</p>
            <p><a href="https://exchangeparkfamilyfestival.com/" rel="noopener">Visit the festival site</a></p>
          </div>
        </article>
        <article class="card">
          <div class="card__media"><img src="/src/assets/img/fairgrounds-day-960.webp" srcset="/src/assets/img/fairgrounds-day-480.webp 480w, /src/assets/img/fairgrounds-day-960.webp 960w, /src/assets/img/fairgrounds-day-1600.webp 1600w" sizes="(min-width: 760px) 50vw, 100vw" width="1600" height="1067" loading="lazy" decoding="async" alt="The Ferris wheel and palms across the lake at Exchange Park"></div>
          <div class="card__body">
            <h3 class="card__title">Exchange Park Food Court</h3>
            <p>Food trucks with dishes from across Central and South America, plus Charleston favorites, every weekend in lot 2B at Exchange Park.</p>
            <p class="card__meta">Saturdays &amp; Sundays · 8 am – 7 pm</p>
            <p class="club-note">Hours: club to confirm</p>
            <p><a href="https://www.facebook.com/ExchangeParkFoodCourt/" rel="noopener">Food Court on Facebook</a></p>
          </div>
        </article>
      </div>
    </div>
  </section>

  <section class="section section--navy" aria-labelledby="volunteer-title">
    <div class="container">
      <div class="section-head section-head--center">
        <h2 id="volunteer-title">Work the fair with us</h2>
        <p class="lede">Members volunteer thousands of hours to run the fair. Join the club and you’re part of the crew.</p>
        <div class="btn-row">
          <a class="btn btn--give" href="join.html">Join the club</a>
          <a class="btn btn--light" href="contact.html?topic=fair">Ask about the fair</a>
        </div>
      </div>
    </div>
  </section>
```

- [ ] **Step 4: Append The Fair block to `src/styles/pages.css`**

```css
/* ---------- The Fair ---------- */
.fair-hero .breadcrumb ol, .fair-hero .breadcrumb a { color: var(--navy-tint); }
.fair-hero .breadcrumb [aria-current='page'] { color: var(--paper); }
.fair-hero .btn-row { gap: var(--space-5); }
```

- [ ] **Step 5: Run the test, then the gates**

Run: `npx vitest run tests/fair.test.js && npm test && npm run build && npm run check`
Expected: fair suite PASS (4 tests); full suite PASS; check-dist clean.

- [ ] **Step 6: Screenshot check** — same commands as Task 5 Step 7 with URL `http://localhost:5181/Exchange-Club-of-Charleston/fair.html` and file names `fair-1280.png` / `fair-390.png`. Expected: dark fair hero with the night photo behind a left-to-right dusk gradient; gold dates; ticket-stub button with visible notches and perforation; legible breadcrumb on dark. Fix contrast/clipping before committing.

- [ ] **Step 7: Commit**

```bash
git add fair.html src/styles/pages.css tests/fair.test.js
git commit -F - <<'MSG'
feat: build the Coastal Carolina Fair page

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_019gmTqZ5kCmSQFTwxrVLfuk
MSG
```

---

### Task 7: Programs page

**Files:**
- Modify: `programs.html` (keep the generated page-hero; add a jump nav inside it after the lede; add four sections after it)
- Modify: `src/styles/pages.css` (append the Programs block)
- Test: `tests/programs.test.js`

**Interfaces:**
- Consumes: `.jump-nav`, `.split`, `.split--reverse`, `.prose`, `.photo` (Task 3); photos `program-child-abuse`, `program-americanism`, `program-youth`, `program-community`.
- Produces: section anchors `#child-abuse-prevention`, `#americanism`, `#youth`, `#community-service` (linked from Home, Give and Stories); give deep links `give.html?fund=child-abuse-prevention|scholarships|community-grants` (Task 11 must honour them).

- [ ] **Step 1: Write the failing test `tests/programs.test.js`**

```js
import { describe, it, expect, beforeAll } from 'vitest';
import { loadPage } from './helpers/load-page.js';

const ids = ['child-abuse-prevention', 'americanism', 'youth', 'community-service'];

describe('programs page', () => {
  beforeAll(() => loadPage('programs.html'));

  it('has one section per program, in order', () => {
    expect([...document.querySelectorAll('main section[id]')].map((s) => s.id)).toEqual(ids);
  });

  it('offers a jump nav to every section', () => {
    const links = [...document.querySelectorAll('.jump-nav a')].map((a) => a.getAttribute('href'));
    expect(links).toEqual(ids.map((id) => `#${id}`));
  });

  it('deep-links gifts to the right fund', () => {
    const gives = [...document.querySelectorAll('main a[href^="give.html"]')].map((a) => a.getAttribute('href'));
    expect(gives).toEqual([
      'give.html?fund=child-abuse-prevention',
      'give.html?fund=scholarships',
      'give.html?fund=community-grants',
    ]);
  });

  it('lists the five scholarship criteria and three student awards', () => {
    const youth = document.getElementById('youth');
    const [criteria, awards] = youth.querySelectorAll('ul');
    expect(criteria.querySelectorAll('li')).toHaveLength(5);
    expect(awards.querySelectorAll('li')).toHaveLength(3);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run tests/programs.test.js`
Expected: FAIL — no sections with ids.

- [ ] **Step 3: Add the jump nav** inside the page-hero `.container`, directly after `<p class="lede">…</p>`:

```html
      <nav class="jump-nav" aria-label="On this page">
        <ul>
          <li><a href="#child-abuse-prevention">Prevention of Child Abuse</a></li>
          <li><a href="#americanism">Americanism</a></li>
          <li><a href="#youth">Youth &amp; Scholarships</a></li>
          <li><a href="#community-service">Community Service</a></li>
        </ul>
      </nav>
```

- [ ] **Step 4: Add the four sections** after the page-hero `</header>`, inside `<main>`:

```html
  <section class="section" id="child-abuse-prevention" aria-labelledby="cap-title">
    <div class="container split">
      <figure class="photo">
        <img src="/src/assets/img/program-child-abuse-960.webp" srcset="/src/assets/img/program-child-abuse-480.webp 480w, /src/assets/img/program-child-abuse-960.webp 960w, /src/assets/img/program-child-abuse-1600.webp 1600w" sizes="(min-width: 900px) 50vw, 100vw" width="1600" height="1067" loading="lazy" decoding="async" alt="Club members with the executive director of the Dee Norton Child Advocacy Center">
      </figure>
      <div class="prose">
        <p class="eyebrow">National project since 1979</p>
        <h2 id="cap-title">Prevention of Child Abuse</h2>
        <p>Preventing child abuse became the National Exchange Club’s national project in 1979. Across the country, Exchange clubs and Exchange Club Centers for the Prevention of Child Abuse support the Parent Aide model, in which trained specialists work directly with families under stress. The work earned Exchange the Presidential Award from the White House Office of Private Sector Initiatives.</p>
        <p>Here in Charleston, we support local partners who do that work every day:</p>
        <ul>
          <li><strong>Dee Norton Child Advocacy Center</strong> — a safe, child-friendly place to turn when there’s a concern about abuse.</li>
          <li><strong>Compass Harbor</strong> — helping young people aging out of foster care move into adult life with housing, support and education.</li>
        </ul>
        <div class="btn-row">
          <a class="btn btn--give" href="give.html?fund=child-abuse-prevention">Give to this program</a>
          <a class="btn btn--secondary" href="story-dee-norton-2024.html">Read: Dee Norton at our lunch</a>
        </div>
      </div>
    </div>
  </section>

  <section class="section section--tint" id="americanism" aria-labelledby="am-title">
    <div class="container split split--reverse">
      <figure class="photo">
        <img src="/src/assets/img/program-americanism-960.webp" srcset="/src/assets/img/program-americanism-480.webp 480w, /src/assets/img/program-americanism-960.webp 960w, /src/assets/img/program-americanism-1600.webp 1600w" sizes="(min-width: 900px) 50vw, 100vw" width="1600" height="1067" loading="lazy" decoding="async" alt="A U.S. Marine is honored at the club’s National Defense luncheon">
      </figure>
      <div class="prose">
        <p class="eyebrow">Pride in country</p>
        <h2 id="am-title">Americanism</h2>
        <p>Americanism celebrates the country’s heritage and thanks the people who serve it.</p>
        <ul>
          <li><strong>Freedom Shrines</strong> — displays of the nation’s founding documents for schools and public spaces.</li>
          <li><strong>Proudly We Hail</strong> — a plaque for people and businesses who fly the flag properly and regularly.</li>
          <li><strong>Give a Kid a Flag to Wave</strong> — putting American flags in young hands at community events.</li>
          <li><strong>Blue &amp; Gold</strong> — our yearly ceremony honoring officers injured in the line of duty.</li>
          <li><strong>National Defense</strong> — a luncheon recognizing members of the Lowcountry’s military community.</li>
        </ul>
        <div class="btn-row">
          <a class="btn btn--secondary" href="story-blue-gold-2024.html">Read: Blue &amp; Gold 2024</a>
        </div>
      </div>
    </div>
  </section>

  <section class="section" id="youth" aria-labelledby="youth-title">
    <div class="container split">
      <figure class="photo">
        <img src="/src/assets/img/program-youth-960.webp" srcset="/src/assets/img/program-youth-480.webp 480w, /src/assets/img/program-youth-960.webp 960w, /src/assets/img/program-youth-1600.webp 1600w" sizes="(min-width: 900px) 50vw, 100vw" width="1600" height="1067" loading="lazy" decoding="async" alt="A scholarship recipient receives her award from the club president">
      </figure>
      <div class="prose">
        <p class="eyebrow">Paid for by the fair</p>
        <h2 id="youth-title">Youth &amp; Scholarships</h2>
        <p>Each March we award academic scholarships from roughly $50,000 set aside from fair proceeds. In 2024 that meant 30 scholarships for students at six schools: American College of the Building Arts, Charleston Southern University, College of Charleston, MUSC, The Citadel and Trident Technical College.</p>
        <h3>Who can apply (2024 criteria)</h3>
        <ul>
          <li>Demonstrated financial need</li>
          <li>Lives in the Tri-County area</li>
          <li>A GPA of 3.0 or higher</li>
          <li>Has completed the freshman (or equivalent) year of college</li>
          <li>Recent involvement in local community service</li>
        </ul>
        <h3>Student awards</h3>
        <ul>
          <li><strong>Youth of the Year</strong> honors students who excel in academics and leadership.</li>
          <li><strong>A.C.E. — Accepting the Challenge of Excellence</strong> recognizes students who overcame adversity to graduate high school.</li>
          <li><strong>Young Citizenship</strong> rewards middle-school students who work hard to be good citizens at home, at school and in their community.</li>
        </ul>
        <div class="btn-row">
          <a class="btn btn--give" href="give.html?fund=scholarships">Fund a scholarship</a>
          <a class="btn btn--secondary" href="story-scholarships-2024.html">Read: 30 scholarships</a>
        </div>
      </div>
    </div>
  </section>

  <section class="section section--tint" id="community-service" aria-labelledby="cs-title">
    <div class="container split split--reverse">
      <figure class="photo">
        <img src="/src/assets/img/program-community-960.webp" srcset="/src/assets/img/program-community-480.webp 480w, /src/assets/img/program-community-960.webp 960w, /src/assets/img/program-community-1600.webp 1600w" sizes="(min-width: 900px) 50vw, 100vw" width="1600" height="1067" loading="lazy" decoding="async" alt="Members in red fair shirts volunteering at the 2026 Spring Festival">
      </figure>
      <div class="prose">
        <p class="eyebrow">Service at scale</p>
        <h2 id="cs-title">Community Service</h2>
        <p>The fair is how we serve at scale. After the latest fair, more than $504,000 went out as grants to over 90 local nonprofits and students, and members logged 15,000+ volunteer hours in 2023.</p>
        <p>Members also turn out for fair workdays at Exchange Park through the year, and invite local nonprofits to our Thursday lunches to tell their story.</p>
        <div class="btn-row">
          <a class="btn btn--give" href="give.html?fund=community-grants">Support community grants</a>
          <a class="btn btn--secondary" href="join.html">Join the club</a>
        </div>
      </div>
    </div>
  </section>
```

- [ ] **Step 5: Append the Programs block to `src/styles/pages.css`**

```css
/* ---------- Programs ---------- */
.page-hero .jump-nav { margin-top: var(--space-2); }
.section[id] { scroll-margin-top: 7rem; }
```

- [ ] **Step 6: Run the test, then the gates**

Run: `npx vitest run tests/programs.test.js && npm test && npm run build && npm run check`
Expected: programs suite PASS (4 tests); full suite PASS; check-dist clean.

- [ ] **Step 7: Commit**

```bash
git add programs.html src/styles/pages.css tests/programs.test.js
git commit -F - <<'MSG'
feat: build the Programs of Service page

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_019gmTqZ5kCmSQFTwxrVLfuk
MSG
```

---

### Task 8: About page

**Files:**
- Modify: `about.html` (keep the generated page-hero; add four sections after it)
- Test: `tests/about.test.js`

**Interfaces:**
- Consumes: `.plaque*`, `.timeline*`, `.leaders*`, `.split`, `.photo` (Task 3); photo `about-officers`.
- Produces: anchor `#covenant` (linked from Home).

- [ ] **Step 1: Write the failing test `tests/about.test.js`**

```js
import { describe, it, expect, beforeAll } from 'vitest';
import { loadPage } from './helpers/load-page.js';

describe('about page', () => {
  beforeAll(() => loadPage('about.html'));

  it('sets the Covenant as a plaque, spelled correctly, six lines', () => {
    const covenant = document.getElementById('covenant');
    expect(covenant.querySelector('.plaque__title').textContent).toBe('The Exchange Covenant');
    expect(covenant.querySelectorAll('.plaque__text p')).toHaveLength(6);
    expect(document.querySelector('main').textContent).not.toMatch(/covenent/i);
  });

  it('tells the club timeline', () => {
    const years = [...document.querySelectorAll('.timeline__year')].map((el) => el.textContent);
    expect(years).toEqual(['1923', '1924', '1957', '1979', '2003', '2026']);
  });

  it('lists 2026–27 officers, directors and committee chairs', () => {
    const [officers, directors, chairs] = document.querySelectorAll('.leaders');
    expect(officers.querySelectorAll('li')).toHaveLength(7);
    expect(directors.querySelectorAll('li')).toHaveLength(8);
    expect(chairs.querySelectorAll('li')).toHaveLength(3);
    expect(officers.querySelector('.leaders__name').textContent).toBe('Ken Battle');
  });

  it('routes the board through the contact form, not personal emails', () => {
    expect(document.querySelector('a[href="contact.html?topic=board"]')).not.toBeNull();
    expect(document.querySelector('main a[href^="mailto:"]')).toBeNull();
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run tests/about.test.js`
Expected: FAIL — `#covenant` does not exist.

- [ ] **Step 3: Add the sections** after the page-hero `</header>`, inside `<main>`:

```html
  <section class="section" aria-labelledby="who-title">
    <div class="container split">
      <div class="prose">
        <p class="eyebrow">Who we are</p>
        <h2 id="who-title">A service club with a fair to run</h2>
        <p>The Exchange Club of Charleston is a member club of the National Exchange Club. We meet every Thursday for lunch, we run the Coastal Carolina Fair, and we put what it raises to work through scholarships, community grants and child-abuse prevention.</p>
        <p>We’re also the largest Exchange Club in the nation.</p>
        <p><a class="btn btn--primary" href="join.html">Join us</a></p>
      </div>
      <figure class="photo">
        <img src="/src/assets/img/about-officers-960.webp" srcset="/src/assets/img/about-officers-480.webp 480w, /src/assets/img/about-officers-960.webp 960w, /src/assets/img/about-officers-1600.webp 1600w" sizes="(min-width: 900px) 50vw, 100vw" width="1600" height="1067" decoding="async" alt="The 2026–27 officers at the installation banquet, June 20, 2026">
        <figcaption>The 2026–27 officers at the installation banquet, June 20, 2026.</figcaption>
      </figure>
    </div>
  </section>

  <section class="section section--tint" aria-labelledby="timeline-title">
    <div class="container">
      <div class="section-head">
        <p class="eyebrow">Our history</p>
        <h2 id="timeline-title">Since 1923</h2>
      </div>
      <ol class="timeline">
        <li class="timeline__item"><span class="timeline__year">1923</span><p class="timeline__text">The club is organized on May 10.</p></li>
        <li class="timeline__item"><span class="timeline__year">1924</span><p class="timeline__text">Chartered on April 15.</p></li>
        <li class="timeline__item"><span class="timeline__year">1957</span><p class="timeline__text">The club takes ownership of the Charleston County fair — today’s Coastal Carolina Fair.</p></li>
        <li class="timeline__item"><span class="timeline__year">1979</span><p class="timeline__text">The fair moves to Exchange Park in Ladson.</p></li>
        <li class="timeline__item"><span class="timeline__year">2003</span><p class="timeline__text">Since this year, the fair has returned more than $11 million to the Lowcountry.</p></li>
        <li class="timeline__item"><span class="timeline__year">2026</span><p class="timeline__text">Ken Battle is installed as president at the June 20 banquet.</p></li>
      </ol>
    </div>
  </section>

  <section class="section" id="covenant" aria-labelledby="covenant-title">
    <div class="container">
      <div class="plaque">
        <h2 class="plaque__title" id="covenant-title">The Exchange Covenant</h2>
        <hr class="plaque__rule">
        <div class="plaque__text">
          <p>Accepting the divine privilege of single and collective responsibility as life’s noblest gift, I covenant with my fellow Exchangites:</p>
          <p>To consecrate my best energies to the uplifting of Social, Religious, Political and Business ideals;</p>
          <p>To discharge the debt I owe to those of high and low estate who have served and sacrificed that the heritage of American citizenship might be mine;</p>
          <p>To honor and respect law, to serve my fellow men, and to uphold the ideals and institutions of my Country;</p>
          <p>To implant the life-giving, society-building spirit of Service and Comradeship in my social and business relationships;</p>
          <p>To serve in Unity with those seeking better conditions, better understandings, and greater opportunities for all.</p>
        </div>
      </div>
    </div>
  </section>

  <section class="section section--tint" aria-labelledby="leaders-title">
    <div class="container">
      <div class="section-head">
        <p class="eyebrow">2026–27</p>
        <h2 id="leaders-title">Club leadership</h2>
        <p class="lede">Reach the board through the contact form — it goes to the right person.</p>
      </div>
      <h3>Officers</h3>
      <ul class="leaders">
        <li><span class="leaders__role">President</span><span class="leaders__name">Ken Battle</span></li>
        <li><span class="leaders__role">President-Elect</span><span class="leaders__name">Artie Beane</span></li>
        <li><span class="leaders__role">Immediate Past President</span><span class="leaders__name">Mike Kearney</span></li>
        <li><span class="leaders__role">1st Vice President</span><span class="leaders__name">Duncan Townsend</span></li>
        <li><span class="leaders__role">2nd Vice President</span><span class="leaders__name">Tommy Blackwood</span></li>
        <li><span class="leaders__role">Secretary</span><span class="leaders__name">Dan Isgett</span></li>
        <li><span class="leaders__role">Treasurer</span><span class="leaders__name">Paul Grantham</span></li>
      </ul>
      <h3>Directors</h3>
      <ul class="leaders">
        <li><span class="leaders__role">Director</span><span class="leaders__name">Stuart Buck</span></li>
        <li><span class="leaders__role">Director</span><span class="leaders__name">Chip Aydlette</span></li>
        <li><span class="leaders__role">Director</span><span class="leaders__name">Paul Franklin</span></li>
        <li><span class="leaders__role">Director</span><span class="leaders__name">Bo Schupp</span></li>
        <li><span class="leaders__role">Director</span><span class="leaders__name">Gene Coon</span></li>
        <li><span class="leaders__role">Director</span><span class="leaders__name">Bruce Root</span></li>
        <li><span class="leaders__role">Director</span><span class="leaders__name">Keith Grybowski</span></li>
        <li><span class="leaders__role">Director</span><span class="leaders__name">Kim Collins</span></li>
      </ul>
      <h3>Committee chairs</h3>
      <ul class="leaders">
        <li><span class="leaders__role">Membership</span><span class="leaders__name">Mike Kearney</span></li>
        <li><span class="leaders__role">Executive</span><span class="leaders__name">Ken Battle</span></li>
        <li><span class="leaders__role">Meeting Administration</span><span class="leaders__name">Artie Beane</span></li>
      </ul>
      <p><a class="btn btn--primary" href="contact.html?topic=board">Contact the board</a></p>
    </div>
  </section>
```

- [ ] **Step 4: Run the test, then the gates**

Run: `npx vitest run tests/about.test.js && npm test && npm run build && npm run check`
Expected: about suite PASS (4 tests); full suite PASS; check-dist clean.

- [ ] **Step 5: Commit**

```bash
git add about.html tests/about.test.js
git commit -F - <<'MSG'
feat: build the About page with the Covenant plaque and leadership

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_019gmTqZ5kCmSQFTwxrVLfuk
MSG
```

---

### Task 9: Stories index, six story pages, gallery, photo-grid renderer, lightbox

**Files:**
- Create: `src/data/stories.js`, `src/data/gallery.js` (generated from plan data), `scripts/render-photos.mjs`, `partials/lightbox.html`, `src/js/flows/lightbox.js`, `src/js/pages/gallery.js`
- Modify: `stories.html`, the six `story-*.html` pages, `gallery.html`, `src/styles/pages.css`
- Test: `tests/render-photos.test.js`, `tests/lightbox.test.js`, `tests/stories.test.js`

**Interfaces:**
- Consumes: plan data `gallery.json`, `story-photos.json`; `loadPage` (Task 4); `.card*`, `.card-list`, `.photo`, `.club-note` (Tasks 3, 5).
- Produces:
  - `src/data/stories.js`: `STORIES: { slug, title, date, dateLabel, image, excerpt }[]`, newest first.
  - `src/data/gallery.js`: `PHOTO_BASE`, `ALBUMS: { slug, title, date, photos: { file, w, h }[] }[]`, `STORY_PHOTOS: Record<slug, { album, file, w, h }[]>`.
  - `scripts/render-photos.mjs`: `thumbUrl(album, file)`, `fullUrl(album, file)`, `photoGridHtml(photos, label, { dense })`, `albumHtml(album)`, `replaceBetween(html, name, content)`; as a script, fills `<!-- photos:gallery --><!-- /photos:gallery -->` in `gallery.html` and `<!-- photos:story --><!-- /photos:story -->` in each story page. Idempotent.
  - `src/js/flows/lightbox.js`: `nextIndex(i, n, dir)`, `mountLightbox(root, doc = document)`; markup hooks `a[data-lightbox]` inside `[data-lightbox-group]`, and the dialog from `partials/lightbox.html`.

- [ ] **Step 1: Generate the gallery data module from the plan data**

```bash
node --input-type=module -e "
import { readFileSync, writeFileSync } from 'node:fs';
const d = 'docs/superpowers/plans/2026-09-11-exchange-club-demo.data/';
const albums = JSON.parse(readFileSync(d + 'gallery.json', 'utf8'));
const stories = JSON.parse(readFileSync(d + 'story-photos.json', 'utf8'));
writeFileSync('src/data/gallery.js',
  '// Hotlinked from the club\'s public ClubRunner photo albums (curated 2026-09-11). Thumbnails are 450 px wide.\n' +
  'export const PHOTO_BASE = \'https://clubrunner.blob.core.windows.net/00000101847\';\n\n' +
  'export const ALBUMS = ' + JSON.stringify(albums, null, 2) + ';\n\n' +
  'export const STORY_PHOTOS = ' + JSON.stringify(stories, null, 2) + ';\n');
"
```

Create `src/data/stories.js`:

```js
/** Story pages, newest first. `image` names a stored photo in src/assets/img. */
export const STORIES = [
  { slug: 'story-fair-workday-2026', title: 'Fair workday at Exchange Park', date: '2026-06-06', dateLabel: 'June 6, 2026', image: 'story-workday',
    excerpt: 'Members spent a Saturday at Exchange Park getting the grounds ready for the fall fair.' },
  { slug: 'story-spring-festival-2026', title: 'Spring Festival 2026', date: '2026-04', dateLabel: 'April 2026', image: 'story-cadets',
    excerpt: 'Rides, a rodeo and a charro show at Exchange Park — with members and Citadel cadets working the grounds.' },
  { slug: 'story-fair-appreciation-2026', title: '2026 Fair Appreciation Party', date: '2026-01-17', dateLabel: 'January 17, 2026', image: 'story-appreciation',
    excerpt: 'An evening for the people behind the 2025 Coastal Carolina Fair.' },
  { slug: 'story-blue-gold-2024', title: 'Blue & Gold: honoring officers injured in the line of duty', date: '2024-05-09', dateLabel: 'May 9, 2024', image: 'story-bluegold',
    excerpt: 'Three Lowcountry officers injured in the line of duty were honored at our yearly Blue & Gold ceremony.' },
  { slug: 'story-dee-norton-2024', title: 'Dee Norton Child Advocacy Center', date: '2024-04-04', dateLabel: 'April 4, 2024', image: 'program-child-abuse',
    excerpt: 'The center’s executive director told members how Dee Norton helps children when there’s a concern about abuse.' },
  { slug: 'story-scholarships-2024', title: 'Thirty scholarships, six schools', date: '2024-03-07', dateLabel: 'March 7, 2024', image: 'program-youth',
    excerpt: 'Fair proceeds paid for 30 scholarships for students at six Lowcountry colleges.' },
];
```

- [ ] **Step 2: Write the failing tests**

`tests/render-photos.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { thumbUrl, fullUrl, photoGridHtml, albumHtml, replaceBetween } from '../scripts/render-photos.mjs';
import { ALBUMS, STORY_PHOTOS } from '../src/data/gallery.js';
import { STORIES } from '../src/data/stories.js';

describe('render-photos', () => {
  it('builds thumbnail and full-size URLs', () => {
    expect(thumbUrl('a-b', 'X 1.JPG')).toBe('https://clubrunner.blob.core.windows.net/00000101847/thumb/PhotoAlbum/a-b/X%201.JPG');
    expect(fullUrl('a-b', 'X.JPG')).toBe('https://clubrunner.blob.core.windows.net/00000101847/PhotoAlbum/a-b/X.JPG');
  });

  it('renders a lazy grid with dimensions, full-size links and numbered alt text', () => {
    const html = photoGridHtml([{ album: 'al', file: 'a.JPG', w: 450, h: 300 }, { album: 'al', file: 'b.JPG', w: 450, h: 299 }], 'Fair & friends');
    expect(html.startsWith('<ul class="photo-grid" data-lightbox-group>')).toBe(true);
    expect(html).toContain('<a class="photo-grid__link" href="https://clubrunner.blob.core.windows.net/00000101847/PhotoAlbum/al/a.JPG" data-lightbox>');
    expect(html).toContain('width="450" height="299" loading="lazy" decoding="async" alt="Photo 2 of 2 — Fair &amp; friends"');
    expect(photoGridHtml([], 'x', { dense: true })).toContain('photo-grid photo-grid--dense');
  });

  it('renders an album section with a heading and count', () => {
    const html = albumHtml(ALBUMS[0]);
    expect(html).toContain(`<section class="album" aria-labelledby="album-${ALBUMS[0].slug}">`);
    expect(html).toContain(`<p class="album__meta">${ALBUMS[0].photos.length} photos</p>`);
  });

  it('replaces only between markers and fails loudly without them', () => {
    expect(replaceBetween('a<!-- photos:x -->old<!-- /photos:x -->b', 'x', 'new$1')).toBe('a<!-- photos:x -->new$1<!-- /photos:x -->b');
    expect(() => replaceBetween('no markers', 'x', '')).toThrow('render-photos: markers for "x" not found');
  });

  it('has six photos for every story page', () => {
    expect(Object.keys(STORY_PHOTOS).sort()).toEqual(STORIES.map((s) => s.slug).sort());
    for (const photos of Object.values(STORY_PHOTOS)) expect(photos).toHaveLength(6);
  });
});
```

`tests/stories.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { loadPage } from './helpers/load-page.js';
import { STORIES } from '../src/data/stories.js';

describe('stories', () => {
  it('lists every story on the index, newest first', () => {
    loadPage('stories.html');
    const links = [...document.querySelectorAll('.card__link')].map((a) => [a.getAttribute('href'), a.textContent]);
    expect(links).toEqual(STORIES.map((s) => [`${s.slug}.html`, s.title]));
  });

  it.each(STORIES.map((s) => [s.slug, s]))('%s has a hero photo, body copy and six rendered photos', (slug, story) => {
    loadPage(`${slug}.html`);
    expect(document.querySelector('h1').textContent).toBe(story.title);
    expect(document.querySelector('.story-meta time').getAttribute('datetime')).toBe(story.date);
    expect(document.querySelector('.story-body .photo img').getAttribute('src')).toBe(`/src/assets/img/${story.image}-960.webp`);
    expect(document.querySelectorAll('.story-body .prose p').length).toBeGreaterThanOrEqual(2);
    expect(document.querySelectorAll('.photo-grid a[data-lightbox]')).toHaveLength(6);
    expect(document.querySelector('[data-lightbox-dialog]')).not.toBeNull();
  });

  it('marks the photo-only 2026 stories as club-to-confirm', () => {
    for (const slug of ['story-fair-workday-2026', 'story-spring-festival-2026', 'story-fair-appreciation-2026']) {
      loadPage(`${slug}.html`);
      expect(document.querySelector('.story-body .club-note')).not.toBeNull();
    }
  });
});
```

`tests/lightbox.test.js`:

```js
import { describe, it, expect, beforeEach } from 'vitest';
import { loadPage } from './helpers/load-page.js';
import { mountLightbox, nextIndex } from '../src/js/flows/lightbox.js';

const click = (el) => el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));

describe('lightbox', () => {
  let dialog;
  let img;
  let caption;
  beforeEach(() => {
    loadPage('gallery.html');
    mountLightbox(document.querySelector('main'));
    dialog = document.querySelector('[data-lightbox-dialog]');
    img = document.querySelector('[data-lightbox-img]');
    caption = document.querySelector('[data-lightbox-caption]');
  });

  it('wraps around at both ends', () => {
    expect(nextIndex(0, 5, -1)).toBe(4);
    expect(nextIndex(4, 5, 1)).toBe(0);
  });

  it('opens the full-size photo with a counter scoped to its album', () => {
    const first = document.querySelector('a[data-lightbox]');
    click(first);
    expect(dialog.open).toBe(true);
    expect(img.getAttribute('src')).toBe(first.getAttribute('href'));
    const albumSize = first.closest('[data-lightbox-group]').querySelectorAll('a[data-lightbox]').length;
    expect(caption.textContent).toBe(`1 of ${albumSize}`);
  });

  it('steps with the buttons and the arrow keys, wrapping within the album', () => {
    const links = [...document.querySelector('[data-lightbox-group]').querySelectorAll('a[data-lightbox]')];
    click(links[0]);
    click(dialog.querySelector('[data-lightbox-prev]'));
    expect(img.getAttribute('src')).toBe(links.at(-1).getAttribute('href'));
    dialog.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    expect(img.getAttribute('src')).toBe(links[0].getAttribute('href'));
    click(dialog.querySelector('[data-lightbox-next]'));
    expect(img.getAttribute('src')).toBe(links[1].getAttribute('href'));
  });

  it('returns focus to the thumbnail when closed', () => {
    const first = document.querySelector('a[data-lightbox]');
    click(first);
    click(dialog.querySelector('[data-lightbox-close]'));
    expect(dialog.open).toBe(false);
    expect(document.activeElement).toBe(first);
  });
});
```

- [ ] **Step 3: Run them to verify they fail**

Run: `npx vitest run tests/render-photos.test.js tests/stories.test.js tests/lightbox.test.js`
Expected: FAIL — `scripts/render-photos.mjs` and `src/js/flows/lightbox.js` do not exist.

- [ ] **Step 4: Implement `scripts/render-photos.mjs`**

```js
#!/usr/bin/env node
// Writes hotlinked photo grids into gallery.html and the story pages, between marker comments.
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { ALBUMS, PHOTO_BASE, STORY_PHOTOS } from '../src/data/gallery.js';
import { STORIES } from '../src/data/stories.js';

const esc = (s) => s.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;');

export const thumbUrl = (album, file) => `${PHOTO_BASE}/thumb/PhotoAlbum/${album}/${encodeURI(file)}`;
export const fullUrl = (album, file) => `${PHOTO_BASE}/PhotoAlbum/${album}/${encodeURI(file)}`;

export function photoGridHtml(photos, label, { dense = false } = {}) {
  const items = photos.map(
    (p, i) =>
      `<li><a class="photo-grid__link" href="${fullUrl(p.album, p.file)}" data-lightbox>` +
      `<img src="${thumbUrl(p.album, p.file)}" width="${p.w}" height="${p.h}" loading="lazy" decoding="async" ` +
      `alt="${esc(`Photo ${i + 1} of ${photos.length} — ${label}`)}"></a></li>`,
  );
  return `<ul class="photo-grid${dense ? ' photo-grid--dense' : ''}" data-lightbox-group>${items.join('')}</ul>`;
}

export function albumHtml(album) {
  const photos = album.photos.map((p) => ({ ...p, album: album.slug }));
  return (
    `<section class="album" aria-labelledby="album-${album.slug}">` +
    `<h2 id="album-${album.slug}">${esc(album.title)}</h2>` +
    `<p class="album__meta">${photos.length} photos</p>` +
    `${photoGridHtml(photos, album.title, { dense: true })}</section>`
  );
}

export function replaceBetween(html, name, content) {
  const markers = new RegExp(`(<!-- photos:${name} -->)[\\s\\S]*?(<!-- /photos:${name} -->)`);
  if (!markers.test(html)) throw new Error(`render-photos: markers for "${name}" not found`);
  return html.replace(markers, (_, open, close) => open + content + close);
}

function main() {
  const root = resolve(import.meta.dirname, '..');
  const update = (file, name, content) => {
    const path = resolve(root, file);
    writeFileSync(path, replaceBetween(readFileSync(path, 'utf8'), name, content));
  };
  update('gallery.html', 'gallery', ALBUMS.map(albumHtml).join(''));
  for (const story of STORIES) update(`${story.slug}.html`, 'story', photoGridHtml(STORY_PHOTOS[story.slug], story.title));
  console.log(`rendered ${ALBUMS.length} albums and ${STORIES.length} story grids`);
}

if (process.argv[1] && resolve(process.argv[1]) === import.meta.filename) main();
```

- [ ] **Step 5: Implement the lightbox**

`partials/lightbox.html`:

```html
<dialog class="lightbox" data-lightbox-dialog aria-label="Photo viewer">
  <figure class="lightbox__figure">
    <img class="lightbox__img" data-lightbox-img src="data:," width="1980" height="1320" alt="">
    <figcaption class="lightbox__caption" data-lightbox-caption></figcaption>
  </figure>
  <button class="lightbox__btn lightbox__btn--prev" type="button" data-lightbox-prev aria-label="Previous photo">‹</button>
  <button class="lightbox__btn lightbox__btn--next" type="button" data-lightbox-next aria-label="Next photo">›</button>
  <button class="lightbox__btn lightbox__btn--close" type="button" data-lightbox-close aria-label="Close photo viewer">×</button>
</dialog>
```

`src/js/flows/lightbox.js`:

```js
export const nextIndex = (i, n, dir) => (i + dir + n) % n;

/** Progressive-enhancement photo viewer: without JS the thumbnail links open the full-size image. */
export function mountLightbox(root, doc = document) {
  const dialog = doc.querySelector('[data-lightbox-dialog]');
  if (!root || !dialog) return;
  const img = dialog.querySelector('[data-lightbox-img]');
  const caption = dialog.querySelector('[data-lightbox-caption]');
  let group = [];
  let index = 0;
  let opener = null;

  const show = (i) => {
    index = i;
    const link = group[i];
    img.src = link.getAttribute('href');
    img.alt = link.querySelector('img')?.getAttribute('alt') ?? '';
    caption.textContent = `${i + 1} of ${group.length}`;
  };
  const step = (dir) => show(nextIndex(index, group.length, dir));

  root.addEventListener('click', (event) => {
    const link = event.target.closest('a[data-lightbox]');
    if (!link) return;
    event.preventDefault();
    group = [...(link.closest('[data-lightbox-group]') ?? root).querySelectorAll('a[data-lightbox]')];
    opener = link;
    show(group.indexOf(link));
    if (!dialog.open) dialog.showModal();
  });
  dialog.querySelector('[data-lightbox-prev]').addEventListener('click', () => step(-1));
  dialog.querySelector('[data-lightbox-next]').addEventListener('click', () => step(1));
  dialog.querySelector('[data-lightbox-close]').addEventListener('click', () => dialog.close());
  dialog.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') step(-1);
    if (event.key === 'ArrowRight') step(1);
  });
  dialog.addEventListener('close', () => opener?.focus());
}
```

`src/js/pages/gallery.js` (used by the gallery and every story page):

```js
import { mountLightbox } from '../flows/lightbox.js';

mountLightbox(document.querySelector('main'));
```

If happy-dom does not fire the `close` event from `dialog.close()`, move the focus restore into the close-button handler as well (keep the `close` listener for the Esc key) and note it in the report.

- [ ] **Step 6: Write the pages**

`gallery.html` — after the page-hero `</header>`, inside `<main>`:

```html
  <div class="section">
    <div class="container">
      <!-- photos:gallery --><!-- /photos:gallery -->
      <p class="album__meta">Photos © Exchange Club of Charleston, from the club’s public albums.</p>
    </div>
  </div>
  <!-- @include partials/lightbox.html -->
```

and before `</body>`: `<script type="module" src="/src/js/pages/gallery.js"></script>`

`stories.html` — after the page-hero `</header>`, inside `<main>` (one card per `STORIES` entry, in order; image `NAME` is the entry's `image`, `ALT` from `scripts/photos.json`, `SIZES` `(min-width: 760px) 33vw, 100vw`, `loading="lazy"`):

```html
  <section class="section" aria-labelledby="stories-list-title">
    <div class="container">
      <h2 class="visually-hidden" id="stories-list-title">All stories</h2>
      <ul class="grid grid--3 card-list">
        <li class="card">
          <div class="card__media"><img src="/src/assets/img/story-workday-960.webp" srcset="/src/assets/img/story-workday-480.webp 480w, /src/assets/img/story-workday-960.webp 960w, /src/assets/img/story-workday-1600.webp 1600w" sizes="(min-width: 760px) 33vw, 100vw" width="1600" height="1067" loading="lazy" decoding="async" alt="Members with buckets and tools at the June 6, 2026 fair workday at Exchange Park"></div>
          <div class="card__body">
            <p class="card__meta"><time datetime="2026-06-06">June 6, 2026</time></p>
            <h3 class="card__title"><a class="card__link" href="story-fair-workday-2026.html">Fair workday at Exchange Park</a></h3>
            <p>Members spent a Saturday at Exchange Park getting the grounds ready for the fall fair.</p>
          </div>
        </li>
        <!-- …five more cards in STORIES order: spring festival (story-cadets), fair appreciation (story-appreciation),
             Blue & Gold (story-bluegold), Dee Norton (program-child-abuse), scholarships (program-youth);
             title, dateLabel, datetime and excerpt from src/data/stories.js, title & escaped as &amp; -->
      </ul>
      <p><a class="btn btn--secondary" href="gallery.html">Browse the photo gallery</a></p>
    </div>
  </section>
```

Write all six `<li class="card">` elements in full (the comment above is guidance for this step only — do not leave it in the file).

Each story page — after the page-hero `</header>`, still inside `<article>`, add this skeleton (hero `NAME` = the story's `image`, `ALT` from `scripts/photos.json`, `SIZES` `(min-width: 1200px) 1100px, 100vw`, no `loading="lazy"`), then `<!-- @include partials/lightbox.html -->` after `</article>` and `<script type="module" src="/src/js/pages/gallery.js"></script>` before `</body>`:

```html
    <div class="section">
      <div class="container story-body">
        <figure class="photo">
          <img src="/src/assets/img/NAME-960.webp" srcset="/src/assets/img/NAME-480.webp 480w, /src/assets/img/NAME-960.webp 960w, /src/assets/img/NAME-1600.webp 1600w" sizes="(min-width: 1200px) 1100px, 100vw" width="1600" height="1067" decoding="async" alt="ALT">
        </figure>
        <div class="prose">
          BODY
        </div>
        <section class="story-photos" aria-labelledby="photos-title">
          <h2 id="photos-title">Photos</h2>
          <!-- photos:story --><!-- /photos:story -->
          <p><a href="gallery.html">More in the photo gallery</a></p>
        </section>
        <p><a href="stories.html">← All stories</a></p>
      </div>
    </div>
```

`BODY` per page (exact copy):

`story-fair-workday-2026.html`:

```html
          <p>On Saturday, June 6, 2026, members met at Exchange Park for a fair workday — one of several through the year that get the grounds ready for the Coastal Carolina Fair.</p>
          <p>The fair runs on volunteers. Workdays like this one are where much of that work happens, months before the gates open on October 29.</p>
          <p class="club-note">Story details: club to confirm</p>
```

`story-spring-festival-2026.html`:

```html
          <p>The 2026 Spring Festival brought rides, a rodeo and a charro and escaramuza show to Exchange Park.</p>
          <p>Members worked the grounds alongside volunteers from The Citadel.</p>
          <p class="club-note">Story details: club to confirm</p>
```

`story-fair-appreciation-2026.html`:

```html
          <p>On January 17, 2026, the club held its Fair Appreciation Party — an evening for the people who made the 2025 Coastal Carolina Fair happen.</p>
          <p>Every fair depends on members, staff and partners giving their time. This was the night to thank them.</p>
          <p class="club-note">Story details: club to confirm</p>
```

`story-scholarships-2024.html`:

```html
          <p>At our March 7, 2024 meeting, the club presented 30 Exchange Club of Charleston Scholarship Awards to students from six schools: American College of the Building Arts, Charleston Southern University, College of Charleston, the Medical University of South Carolina, The Citadel and Trident Technical College.</p>
          <p>The awards are paid for with money raised by the Coastal Carolina Fair. The Scholarship Committee — chair Danny Isgett with Mark Heath and Eduard Weathers — reviewed applicants against five criteria:</p>
          <ul>
            <li>Demonstrated financial need</li>
            <li>Lives in the Tri-County area</li>
            <li>A GPA of 3.0 or higher</li>
            <li>Has completed the freshman (or equivalent) year of college</li>
            <li>Recent involvement in local community service</li>
          </ul>
          <p>Congratulations to every recipient. <a href="programs.html#youth">More on our youth programs</a>.</p>
```

`story-blue-gold-2024.html`:

```html
          <p>Every year the Blue &amp; Gold ceremony honors law-enforcement officers injured in the line of duty. At our May 9, 2024 meeting, introduced by program chairman Dan Isgett, Charleston County Sheriff Kristen Graziano was our guest speaker.</p>
          <p>The club honored Charleston County Deputies James Gilbreath and Evan Cubbage and Mount Pleasant Police Officer Adam Blakenship, each injured in the line of duty during 2023.</p>
          <p>The ceremony is part of our <a href="programs.html#americanism">Americanism program</a>.</p>
```

`story-dee-norton-2024.html`:

```html
          <p>At our April 4, 2024 meeting, program chairman Brian Myers welcomed Beverly Hutchison, executive director of the Dee Norton Child Advocacy Center.</p>
          <p>Dee Norton is a safe, child-friendly place to turn when there is a concern about abuse, with a full-spectrum approach meant to give every person the resources they need to help every child.</p>
          <p>The center is one of the local partners in our <a href="programs.html#child-abuse-prevention">child-abuse prevention work</a>. Learn more or give at <a href="https://www.deenortoncenter.org/" rel="noopener">deenortoncenter.org</a>.</p>
```

- [ ] **Step 7: Render the photo grids**

Run: `node scripts/render-photos.mjs && grep -c 'data-lightbox>' gallery.html story-*.html`
Expected: `rendered 8 albums and 6 story grids`; gallery.html `79`; each story page `6`. Re-running must leave the files unchanged (`git diff --stat` identical after a second run).

- [ ] **Step 8: Append the Stories/Gallery block to `src/styles/pages.css`**

```css
/* ---------- Stories, gallery, lightbox ---------- */
.story-body { display: grid; gap: var(--space-6); }
.story-body > .photo img { max-height: 70vh; }
.story-body .prose { font-size: 1.1rem; }
.story-photos { display: grid; gap: var(--space-4); }
.photo-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: var(--space-3); margin: 0; padding: 0; list-style: none; }
@media (min-width: 760px) { .photo-grid { grid-template-columns: repeat(3, 1fr); } }
@media (min-width: 1100px) { .photo-grid--dense { grid-template-columns: repeat(4, 1fr); } }
.photo-grid__link { display: block; overflow: hidden; background: var(--navy-tint); border-radius: var(--radius); }
.photo-grid__link img { width: 100%; aspect-ratio: 3 / 2; object-fit: cover; transition: transform 0.3s; }
.photo-grid__link:hover img { transform: scale(1.03); }
.album { display: grid; gap: var(--space-4); margin-bottom: var(--space-7); }
.album__meta { color: var(--muted); font-size: var(--step--1); font-variant-numeric: tabular-nums; }
.lightbox { width: min(96vw, 1100px); max-height: 94vh; padding: 0; overflow: hidden; background: var(--navy-deep); color: var(--paper); border: 0; border-radius: var(--radius-lg); }
.lightbox::backdrop { background: var(--scrim); }
.lightbox :focus-visible { outline-color: var(--gold); }
.lightbox__figure { display: grid; gap: var(--space-2); padding: var(--space-4) var(--space-4) var(--space-3); }
.lightbox__img { width: 100%; max-height: 80vh; object-fit: contain; }
.lightbox__caption { color: var(--navy-tint); font-size: var(--step--1); text-align: center; font-variant-numeric: tabular-nums; }
.lightbox__btn {
  position: absolute; display: grid; place-items: center; width: 44px; height: 44px;
  background: color-mix(in srgb, var(--paper) 16%, transparent); color: var(--paper);
  border: 0; border-radius: 50%; font-size: 1.6rem; line-height: 1; cursor: pointer;
}
.lightbox__btn:hover { background: color-mix(in srgb, var(--paper) 28%, transparent); }
.lightbox__btn--prev { left: var(--space-3); top: 50%; translate: 0 -50%; }
.lightbox__btn--next { right: var(--space-3); top: 50%; translate: 0 -50%; }
.lightbox__btn--close { right: var(--space-3); top: var(--space-3); }
```

- [ ] **Step 9: Run the tests, then the gates**

Run: `npx vitest run tests/render-photos.test.js tests/stories.test.js tests/lightbox.test.js && npm test && npm run build && npm run check`
Expected: all three suites PASS; full suite PASS; check-dist clean (gallery thumbnails are external URLs and are not resolved; every `<img>` has alt/width/height).

- [ ] **Step 10: Screenshot check** — Task 5 Step 7 commands for `gallery.html` and `story-blue-gold-2024.html` at 1280. Expected: album headings with 4-column grids; the story hero photo, body copy, a 3-column photo grid. Click-testing the lightbox is covered by `tests/lightbox.test.js`.

- [ ] **Step 11: Commit**

```bash
git add src/data/stories.js src/data/gallery.js scripts/render-photos.mjs partials/lightbox.html src/js/flows/lightbox.js src/js/pages/gallery.js stories.html story-*.html gallery.html src/styles/pages.css tests/render-photos.test.js tests/stories.test.js tests/lightbox.test.js
git commit -F - <<'MSG'
feat: add stories, story pages, photo gallery and lightbox

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_019gmTqZ5kCmSQFTwxrVLfuk
MSG
```

- [ ] **Step 12: End of Part 2 — merge and push**

```bash
git checkout main && git merge --no-ff feat/demo-site -F - <<'MSG' && git push origin main && git checkout feat/demo-site
Merge part 2: content pages

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_019gmTqZ5kCmSQFTwxrVLfuk
MSG
```
