# Exchange Club of Charleston — Demo Site Design

**Date:** 2026-09-11 · **Status:** approved in chat (brainstorming) · **Repo:** `quinto55/Exchange-Club-of-Charleston`

## 1. Purpose

A clickable, credible demo of a replacement for `exchangeclubofcharleston.org`, built for
Anthony to show the club's board. It must visibly fix every finding in the 2026-09-11 audit
(44 findings; copied into `docs/AUDIT.md`) and feel like a finished website, not a mockup.

It is an **unofficial redesign concept**: front-end only, no backend, nothing sent or charged,
not indexed by search engines.

### Non-goals

- Real payments, real form submission, real authentication, email, or a CMS.
- Site search (12 pages; navigation suffices), multilingual content, dark mode (the design
  commits to a light "paper" look deliberately; `color-scheme: light`).
- Analytics or trackers of any kind.
- Pixel-matching the current site. Facts are preserved; copy and design are new.

## 2. Principles

1. **Every audit finding has a visible fix** — tracked in `docs/AUDIT-MAP.md` (finding № → where
   and how the demo fixes it). This file is the pitch sheet.
2. **Honest content.** Facts come only from the club's live site (crawled 2026-09-11), the
   Coastal Carolina Fair facts already sourced in the fair demo (2026-07-18), or are marked
   with the demo's **"Club to confirm"** note style. No invented events, numbers, or quotes.
3. **Demo honesty.** Every interactive flow ends in a confirmation clearly labeled *Demo*.
   No flow makes a network request. Member-portal people are fictional.
4. **Works without JavaScript** for all content pages; JS enhances (countdown, next meeting,
   flows, lightbox). Flow pages show a static explanation when JS is off.
5. **Optimized by default:** static HTML, one CSS file, small ES modules, self-hosted fonts,
   responsive WebP photos, zero third-party scripts.

## 3. Information architecture

Flat file structure at the repo root so relative links work under the GitHub Pages base path.
Primary nav: **Programs · The Fair · Meetings · Stories · About**, plus buttons **Give** (gold)
and **Join** (navy). Utility bar: *Next meeting* line with RSVP link, and *Member portal*.
Gallery and Contact live in the footer and in contextual links.

| File | Page | Key content |
| --- | --- | --- |
| `index.html` | Home | Hero; fair card + countdown; impact band; 4 programs; next 3 meetings + RSVP; latest 3 stories; Covenant line; Join/Give band |
| `fair.html` | The Fair & fundraisers | Fair hero (fair palette) + countdown + tickets; where the money goes; history 1922→today; Family Festival & Triple B; Exchange Park Food Court |
| `programs.html` | Programs of Service | Anchored sections `#child-abuse-prevention`, `#americanism`, `#youth`, `#community-service` |
| `give.html` | Give | Donate flow; other ways to give |
| `join.html` | Join | Why join; what membership involves; FAQ; application flow |
| `meetings.html` | Meetings & Events | Thursday-lunch block; upcoming meetings (place cards); RSVP flow; calendar subscribe |
| `stories.html` | Stories | Story index, newest first |
| `story-*.html` (6) | Story articles | See §7.3 |
| `about.html` | About | Who we are; timeline; Covenant plaque; 2026–27 leadership; committees |
| `gallery.html` | Gallery | Curated albums; `<dialog>` lightbox |
| `contact.html` | Contact | Topic-routed form; location; socials |
| `portal.html` | Member Portal | Demo gate → dashboard |
| `privacy.html` | Privacy | What the demo stores (localStorage/sessionStorage keys), no cookies, no trackers |
| `404.html` | Not found | Friendly message + primary links |

### Page outlines

**Home.** (1) Utility bar. (2) Header. (3) Hero — eyebrow "The Exchange Club of Charleston ·
Est. 1923"; H1 "Unity for Service, since 1923."; one-paragraph lede naming the club as a
National Exchange Club member club and the organization behind the Coastal Carolina Fair; CTAs
"Visit a Thursday lunch" → `meetings.html#rsvp`, "Give" → `give.html`. Beside it: a hero photo
and the **fair card** (fair palette: dates, place, live countdown, ticket-stub "Get tickets"
button, "About the fair" link). (4) Impact band — four figures with a source footnote (§7.1).
(5) Programs — four cards linking to `programs.html` anchors. (6) "Meet us Thursday" — next
three meetings as place cards + RSVP link + address. (7) Latest from the club — three story
cards. (8) Covenant closing line as a pull quote linking to `about.html#covenant`.
(9) Join / Give split band. (10) Footer.

**The Fair.** Fair-palette hero: "Coastal Carolina Fair · Oct 29 – Nov 8, 2026 · Exchange Park,
9850 Highway 78, Ladson" + countdown + ticket-stub CTA to the official tickets page + secondary
link "Preview the fair site redesign" (Anthony's fair demo). "Where the money goes" (grants,
scholarships, figures). "A fair since 1922" timeline. Other fundraisers: **Family Festival &
Triple B Cowboy Challenge** (spring, Exchange Park; "2027 dates to be announced"; link to
`https://exchangeparkfamilyfestival.com/`) and **Exchange Park Food Court** (Saturdays &
Sundays 8 am–7 pm, lot 2B, food trucks; hours marked *Club to confirm*).

**Programs.** Each section: what it is, what the Charleston club does, local partners/examples,
closing "Get involved" links (RSVP, Join).
- *Prevention of Child Abuse* — Exchange's National Project since 1979; Parent Aide home-visitation
  model; local partners Dee Norton Child Advocacy Center and Compass Harbor.
- *Americanism* — Freedom Shrines, Proudly We Hail, Give a Kid a Flag to Wave; the Blue & Gold
  ceremony (officers injured in the line of duty); the National Defense military-appreciation luncheon.
- *Youth & Scholarships* — ~$50,000 set aside yearly from fair proceeds; 30 awards in 2024 across
  six schools, with the five published criteria; Youth of the Year; A.C.E.; Young Citizenship.
- *Community Service* — fair-funded grants to local nonprofits and students (§7.1 figures);
  volunteer hours. (This page is a 404 on the live site.)

**Give.** Donate flow (§6.1). "Other ways to give": sponsor the fair, volunteer at a fair
workday, in-kind gifts — each with a contact link. Transparency line: fair proceeds fund the
programs; tax status *Club to confirm*.

**Join.** Why join (leadership, networking, service — from the live Become a Member page); what
membership involves (Thursday lunch at noon, fair volunteer shifts, committees); dues *Club to
confirm*; FAQ via native `<details>`; application flow (§6.2).

**Meetings.** "Thursdays at 12:00 PM · Charleston Rifle Club · 2221 Heriot St, Charleston, SC
29403" with a Google Maps link; what to expect as a guest (lunch, a guest speaker); upcoming
meetings as place cards; RSVP flow (§6.3); "Subscribe to calendar" generates an `.ics` of all
upcoming meetings.

**About.** Who we are (largest Exchange Club in the nation — the club's own claim); timeline
(organized May 10, 1923; chartered April 15, 1924; took over the county fair 1957; fair moves to
Ladson 1979; $11M+ returned since 2003); **Covenant plaque** (`#covenant`, full text §7.2,
spelled correctly); 2026–27 leadership and committees (names and roles only; "Contact the board"
→ `contact.html?topic=board`).

**Gallery.** 6–8 curated albums; thumbnails hotlinked from the club's album storage
(`.../thumb/PhotoAlbum/<album>/<file>`, 450 px); lightbox shows the full-size hotlinked image
(`.../PhotoAlbum/<album>/<file>`, ~1980 px). Keyboard: arrows, Esc; focus returns to the thumb.

**Contact.** Topic select: General, Membership, The Fair, Donations, Media, Board. Helper text
states which role the topic routes to "in production" (e.g., Membership → Membership Committee
chair). `?topic=` preselects. Demo confirmation (§6.5).

## 4. Visual system — "Unity for Service"

### 4.1 Color

| Token | Hex | Role |
| --- | --- | --- |
| `--navy` | `#1B2A6B` | Primary: headings, primary buttons, links |
| `--navy-deep` | `#111A45` | Footer, utility bar |
| `--navy-tint` | `#E6E9F3` | Tinted panels |
| `--gold` | `#C9A227` | Accent fills, rules, seal, Give button — **never text on light grounds** |
| `--gold-ink` | `#7A5C0B` | Gold-toned small text on light grounds (AA) |
| `--linen` | `#F7F4EC` | Page ground |
| `--paper` | `#FFFFFF` | Cards, forms |
| `--ink` | `#15193A` | Body text |
| `--muted` | `#4B5170` | Secondary text |
| `--rule` | `#DAD5C7` | Borders, dividers |
| `--success` | `#1F7A4D` | Confirmations |
| `--danger` | `#B42318` | Validation errors |
| `--fair-dusk` | `#111A3A` | Fair module only |
| `--fair-red` | `#D5382C` | Fair module only (ticket-stub button) |
| `--fair-bulb` | `#FFC53D` | Fair module only |

All text/background pairs used must meet WCAG AA (4.5:1 normal, 3:1 large); gold text only on
navy/deep-navy grounds.

### 4.2 Type

- **Display:** Libre Caslon Display 400 — H1 and hero lines. Caslon's lineage printed the
  Declaration of Independence; fits a club with an Americanism program.
- **Text serif:** Libre Caslon Text 400/700 + 400 italic — H2/H3, pull quotes, the Covenant.
- **Sans:** Public Sans (variable, 400–700) — body, UI, forms, labels. The US government's
  civic typeface.
- All three self-hosted as latin-subset WOFF2 in `public/fonts/` (SIL OFL); Display and Public
  Sans preloaded. `font-display: swap`; fallback stacks `Georgia, 'Times New Roman', serif` and
  `system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif`.
- Scale (1.25): body 17 px; H3 1.33rem; H2 `clamp(1.9rem, 3.5vw, 2.6rem)`; H1
  `clamp(2.6rem, 6vw, 4.2rem)`; eyebrow 0.78rem uppercase, `letter-spacing: .14em`, Public Sans 600.
- Measure ≤ 66ch for running text; `text-wrap: balance` on headings; `tabular-nums` for dates,
  times, amounts, countdown.

### 4.3 Layout & components

- Container max 1200 px; section rhythm via `gap`, not stacked margins.
- **Header:** utility bar (deep navy) + main bar (seal + wordmark, nav, Give, Join). Mobile
  (< 900 px): menu button opens a full-height sheet; **Give stays visible in the bar** on phones
  (fixes finding 21).
- **Seal (signature):** original inline SVG — circular text "UNITY FOR SERVICE · EXCHANGE CLUB
  OF CHARLESTON · 1923" around a palmetto and crescent (motifs from the club's own artwork).
  Used in the header, footer, and as a section mark. The official National Exchange Club
  emblem appears as an optimized image in the footer and About page only.
- **Covenant plaque (signature):** double gold rule frame on paper, Caslon italic lines.
- **Meeting place card (signature):** date block (month abbrev + day in Caslon, weekday + time
  in Public Sans), venue line, "Guests welcome" tag, RSVP action.
- **Ticket-stub button:** perforated-edge button in fair red — **fair module only**.
- Cards (programs, stories), impact figures, timeline, step indicator ("Step 1 of 3"),
  form fields with inline errors, demo notice (small gold-bordered note: "Demo — nothing is
  sent or charged."), `<dialog>` lightbox, native `<details>` FAQ.
- Buttons: primary (navy solid), secondary (navy outline), give (gold solid, navy text).
- Focus: 3 px `--gold` outline with 2 px offset on navy grounds, `--navy` on light grounds.

### 4.4 Motion

Minimal: cross-document view transitions (`@view-transition { navigation: auto; }`), header
shadow after scroll, lightbox fade, countdown tick. All disabled or reduced under
`prefers-reduced-motion: reduce`.

## 5. Photography & brand assets

- **Curated photos (~15):** downloaded full-size from the club's public album storage,
  converted by `scripts/optimize-images.py` (PIL) to WebP at 480/960/1600 px widths, stored in
  `public/img/`, served with `srcset`/`sizes`, explicit `width`/`height`, `loading="lazy"`
  (except the hero, which is `fetchpriority="high"`). The script records source URLs so it is
  reproducible.
- **Selection criteria:** members in action, fair energy (opening ceremony, grounds, night),
  scholarship/award ceremonies with adults as subjects; ≥ 1600 px source. **No minors as focal
  subjects** — skip the youth-award albums (`weekly-meeting-4-18-2024-youth-award-ace`,
  `weekly-meeting-4-11-2014-youth-citizenship-award`, `weekly-meeting-09-12-2024-youth-mentor`).
- **Logo:** the club's emblem (`ThemeLogos/en-us/LightBG_color-logo-transparent.png`, 920×870)
  re-encoded to WebP at 160 and 320 px (target ≤ 20 KB each;
  the live site's is 773 KB). Coastal Carolina Fair logo hotlinked from the fair's CDN, as the
  fair demo does.
- **Gallery thumbnails and lightbox images** are hotlinked, not stored.
- README carries the ownership notice: photos, logos and marks remain the property of the
  Exchange Club of Charleston / National Exchange Club / Coastal Carolina Fair, shown only as
  part of a redesign concept prepared for the club's review.

## 6. Demo flows

Each flow is an ES module in `src/js/flows/` exporting **pure functions** (state, validation,
formatting — unit-tested) and a `mount(root)` that binds the DOM. No flow performs a network
request. Confirmations carry a demo reference `DEMO-` + 6 uppercase alphanumerics.

### 6.1 Donate (`give.html`)

- **Step 1 — Your gift:** fund (radio cards): *Scholarships*, *Child Abuse Prevention*,
  *Fair Community Grants*, *Where it's needed most* (default). Amount presets $50 / $100 /
  $250 (default) / $500 + custom. Frequency: one-time (default) / monthly.
- **Step 2 — Your details:** first name, last name, email (required); optional tribute
  (in honor of / in memory of + name).
- **Step 3 — Review:** summary; monthly shows "$X per month ($12X per year)". Payment panel is a
  **placeholder with no card fields**: "In production this hands off to the club's payment
  processor. No payment is collected in this demo."
- **Confirm:** receipt-style card (fund, amount, frequency, tribute, reference, date) + "Give again".
- **Validation:** custom amount whole dollars, $5 ≤ amount ≤ $100,000; required fields
  non-empty after trim; email matches `^[^\s@]+@[^\s@]+\.[^\s@]+$`; tribute name required when
  tribute is on. Errors are inline, announced via `aria-live="polite"`, focus moves to the
  first invalid field.
- **Deep link:** `give.html?fund=scholarships|child-abuse-prevention|community-grants|general`
  preselects the fund (used by program pages).

### 6.2 Membership application (`join.html`)

- **Step 1 — Contact:** first, last, email (required); phone optional — when present it must
  contain 10 digits (or 11 starting with 1) after removing non-digits.
- **Step 2 — About you:** occupation / business (optional); how you heard (member referral,
  the fair, an event, online, other); interests (checkboxes: Fair operations, Scholarships &
  youth, Child abuse prevention, Americanism & military, Community service) — at least one.
- **Confirm:** "Demo — application received" + next step: "Join us as a guest at a Thursday
  lunch" → `meetings.html#rsvp`.

### 6.3 Meeting RSVP (`meetings.html#rsvp`)

- Choose one upcoming meeting (place-card radios), guests 1–4, name + email (required).
- **Upcoming list:** sourced meetings (§7.1) filtered to those after "now"; if fewer than
  three remain, append generated Thursdays at 12:00 PM labeled *Tentative*, so the demo never
  shows an empty list. "Now" is injectable for tests.
- **Confirm:** summary + **Add to calendar** — a client-generated `.ics` (VEVENT with UID,
  DTSTART/DTEND as UTC (`Z`) converted from the Eastern-time start, 60-minute duration assumed, SUMMARY, LOCATION, DESCRIPTION) downloaded via
  Blob. Also used by the page's "Subscribe to calendar" (all upcoming meetings).

### 6.4 Member portal (`portal.html`)

- **Gate:** explanation + one button "Continue as demo member" (no username/password fields).
  Sets `sessionStorage['ecc.portal']='demo'`. Sign out clears it.
- **Dashboard** (all data fictional, labeled "Demo data — fictional members"):
  - Welcome card for fictional member *Jordan Avery*, member since 2019.
  - Dues: "Paid through June 30, 2027".
  - Fair workday & fair shifts: 6 fictional shifts; sign up / withdraw; capacity counts.
  - Committees: Membership, Fair Operations, Scholarship, Programs, Fellowship — join/leave.
  - Roster: 24 fictional members (name, committee, member since) with a text filter.
  - Announcements: 3 short items tied to real dates (Fair Oct 29 – Nov 8; next meeting).
- State persists in `localStorage['ecc.portal.state']` (shifts, committees); "Reset demo" clears.

### 6.5 Contact (`contact.html`)

Name, email, topic, message (required); topic routing helper text; `?topic=` preselect;
demo confirmation with reference. Same validation helpers as §6.1.

### 6.6 Shared behaviors

- **Fair countdown** (home, fair page): start `2026-10-29T15:00:00-04:00`, end
  `2026-11-08T21:00:00-05:00`. States: *before* ("N days · HH:MM:SS until gates open"),
  *during* ("The fair is on — through Sunday, Nov 8"), *after* ("Thanks for a great 2026 fair —
  2027 dates coming soon"). Static fallback text shows the dates.
- **Next meeting** in the utility bar computed from the meetings data; static fallback
  "Thursdays at 12:00 PM · Charleston Rifle Club".

## 7. Content

### 7.1 Sourced facts

- **Club:** organized May 10, 1923; chartered April 15, 1924; member of the National Exchange
  Club; "the largest Exchange Club in the nation" (club's own claim); owns and operates the
  Coastal Carolina Fair.
- **Meetings:** Thursdays 12:00 PM, Charleston Rifle Club, 2221 Heriot St, Charleston, SC 29403
  (map `32.814137,-79.957306`). Upcoming (live calendar, 2026): Sep 17, Oct 1, Oct 8, Oct 15,
  Nov 5 — "Weekly Club Meeting – Guests Welcome".
- **Fair:** Oct 29 – Nov 8, 2026; gates open 3:00 PM Oct 29, closes 9:00 PM Nov 8 (club calendar);
  Exchange Park, 9850 Highway 78, Ladson, SC 29456; club-run since 1957; at Ladson since 1979;
  180+ acres. Official tickets: `https://www.coastalcarolinafair.org/p/tickets--deals`.
  Fair demo: `https://quinto55.github.io/Coastal-Carolina-Fair-/`.
- **Impact figures** (from the fair site via the fair demo, 2026-07-18): $11M+ returned to the
  Lowcountry since 2003; $504,000+ granted to 90+ local nonprofits and students after the latest
  fair; 15,000+ volunteer hours (2023). Scholarships: ~$50,000 set aside each year (club's Youth
  Programs page); 30 scholarships to students from 6 schools in 2024.
- **Fair history:** Charleston County fair since 1922 (College Park, Rutledge Ave, 2 years);
  1924 Charleston Rifle Club grounds; 1925–29 Marion Square; 1930 grounds around Johnson Hagood
  Stadium; no full fair 1942–44; 1957 the Exchange Club assumes ownership.
- **Leadership 2026–27:** President Ken Battle; President-Elect Artie Beane; Immediate Past
  President Mike Kearney; 1st Vice President Duncan Townsend; 2nd Vice President Tommy Blackwood;
  Secretary Dan Isgett; Treasurer Paul Grantham. Directors: Stuart Buck, Chip Aydlette, Paul
  Franklin, Bo Schupp, Gene Coon, Bruce Root, Keith Grybowski, Kim Collins. Committee chairs:
  Membership — Mike Kearney; Executive — Ken Battle; Meeting Administration — Artie Beane.
- **Scholarship criteria (2024):** demonstrated financial need; lives in the Tri-County area;
  GPA ≥ 3.0; completed freshman (or equivalent) year of college; recent local community
  service. Schools: American College of the Building Arts, Charleston Southern University,
  College of Charleston, MUSC, The Citadel, Trident Technical College.
- **Socials:** `https://www.facebook.com/ExchangeClubofCharlestonSC`,
  `https://www.facebook.com/CoastalCarolinaFair`. (No YouTube link — the live site's points to
  the vendor's channel.)

### 7.2 The Exchange Covenant (full text)

> Accepting the divine privilege of single and collective responsibility as life's noblest
> gift, I covenant with my fellow Exchangites:
> To consecrate my best energies to the uplifting of Social, Religious, Political and Business ideals;
> To discharge the debt I owe to those of high and low estate who have served and sacrificed
> that the heritage of American citizenship might be mine;
> To honor and respect law, to serve my fellow men, and to uphold the ideals and institutions of my Country;
> To implant the life-giving, society-building spirit of Service and Comradeship in my social
> and business relationships;
> To serve in Unity with those seeking better conditions, better understandings, and greater
> opportunities for all.

### 7.3 Stories (six pages, data in `src/data/stories.js`)

| Slug | Title | Date | Basis |
| --- | --- | --- | --- |
| `story-spring-festival-2026` | Spring Festival 2026 | 2026-04-21 | Album photos (Citadel cadets; Spanish show) |
| `story-fair-workday-2026` | Fair workday at Exchange Park | 2026-06-06 | Album photos |
| `story-fair-appreciation-2026` | 2026 Fair Appreciation Party | 2026-01-17 | Album photos |
| `story-scholarships-2024` | Thirty scholarships, six schools | 2024-03-07 | Live story text |
| `story-blue-gold-2024` | Blue & Gold: honoring officers injured in the line of duty | 2024-05-09 | Live story text |
| `story-dee-norton-2024` | Dee Norton Child Advocacy Center | 2024-04-04 | Live story text |

Photo-based 2026 stories use short factual captions only (event, date, place) plus a photo
grid; anything beyond that is marked *Club to confirm*. 2024 stories are rewritten from the
club's own posts and keep their real dates.

### 7.4 "Club to confirm" items

Annual dues; donation processor and tax status; Food Court hours; 2027 spring festival dates;
2026 story details beyond album titles. Rendered as a small inline note, and listed in the
README so the club knows what to supply.

## 8. Technical architecture

### 8.1 Stack & layout

Vite (multi-page) + Vitest + happy-dom. Node 20. Runtime output: static HTML/CSS/JS, no
framework, no runtime dependencies.

```
index.html … 404.html, story-*.html      pages (flat, repo root)
partials/header.html, partials/footer.html, partials/head.html
plugins/html-partials.js                 custom Vite plugin (§8.2)
src/styles/main.css                      tokens + components (single file)
src/js/main.js                           nav sheet, header state, countdown, next meeting
src/js/lib/                              dates.js, validate.js, ics.js, ref.js, storage.js
src/js/flows/                            donate.js, join.js, rsvp.js, portal.js, contact.js, lightbox.js
src/data/                                club.js, meetings.js, officers.js, funds.js, stories.js, gallery.js, portal-demo.js
public/fonts/, public/img/, public/og/    self-hosted fonts, optimized photos, OG images
public/robots.txt, public/favicon.svg
scripts/optimize-images.py               photo pipeline (PIL → WebP)
scripts/check-dist.mjs                   post-build site lint (§8.4)
tests/                                   Vitest suites
docs/AUDIT.md, docs/AUDIT-MAP.md, docs/superpowers/…    pitch sheet, spec, plan
.github/workflows/deploy.yml             CI: test → build → check → deploy Pages
```

### 8.2 Partials plugin

`plugins/html-partials.js` implements `transformIndexHtml`: replaces
`<!-- @include partials/<name>.html -->` with the partial's contents (dev and build), then
reads the page's `<body data-page="<key>">` and sets `aria-current="page"` on the nav link
with matching `data-nav="<key>"`. Unknown include → build error naming the file. Pure
transform function exported for unit tests.

### 8.3 Config & base path

`vite.config.js`: `base` = `'/Exchange-Club-of-Charleston/'` for `build`, `'/'` for dev;
`build.rollupOptions.input` = every root-level `*.html`. Internal page links are relative
(`about.html`), so pages work at any base.

### 8.4 Quality gates

- **Unit tests (Vitest):** donate/join/contact validation and formatting; RSVP upcoming-list
  logic with injected "now" (incl. tentative fill); ICS output; countdown state machine
  (before/during/after, DST boundary); portal state reducers (shifts capacity, committees,
  roster filter, reset); partials transform (include, aria-current, missing include error);
  demo reference format.
- **DOM tests (happy-dom):** each flow's `mount()` — step navigation, inline errors, focus on
  first invalid field, confirmation render, zero `fetch` calls (spy).
- **`scripts/check-dist.mjs`** (run after build, fails CI): every page has a unique `<title>`
  and meta description, canonical, OG + Twitter tags, `<meta name="robots" content="noindex">`,
  exactly one non-empty `<h1>`, no skipped heading levels, every `<img>` has `alt` and
  `width`/`height`, every internal `href`/`src` resolves in `dist/`, no `href=""`, no
  `google.com` placeholder, no `&amp;amp;`.
- **Visual check:** Windows Chrome headless screenshots of every page at 360, 768 and 1280 px;
  no horizontal scroll (document width ≤ viewport) at each width.

### 8.5 SEO, metadata, accessibility, performance

- Per-page unique title ("<Page> · Exchange Club of Charleston"; home: "Exchange Club of
  Charleston — Unity for Service since 1923") and description; canonical to the demo URL;
  OG/Twitter with a 1200×630 OG image rendered from HTML via Windows Chrome headless.
- JSON-LD: `NGO` (Organization) on home/about (name, url, logo, foundingDate `1923-05-10`,
  sameAs); `Festival` on fair page (dates, Exchange Park address, offers URL); `Event` per
  listed meeting on meetings page; `BreadcrumbList` on interior pages.
- **Share-safe demo:** `noindex` on every page + `robots.txt` `Disallow: /`, with comments
  explaining removal at real launch (same as the fair demo).
- A11y: skip link, landmarks, `aria-current`, visible focus, AA contrast, labeled form
  controls, `aria-live` errors, keyboard-complete flows and lightbox, reduced motion.
- Performance budget: homepage first load ≤ 500 KB transferred at 1280 px (fonts + hero +
  CSS + JS); logo derivative ≤ 20 KB; no render-blocking third-party requests. Lighthouse is
  run post-deploy via PageSpeed Insights as a report, not a gate (SEO is capped by the
  deliberate `noindex`).

### 8.6 Deploy

`.github/workflows/deploy.yml`: on push to `main` → `npm ci` → `npm test` → `npm run build`
→ `node scripts/check-dist.mjs` → upload `dist/` → `actions/deploy-pages`. Pages enabled via
`actions/configure-pages` with `enablement: true`. Live URL:
`https://quinto55.github.io/Exchange-Club-of-Charleston/`.

## 9. Workflow

Superpowers: this spec → implementation plan (`docs/superpowers/plans/`) → subagent-driven
execution on feature branches in the main checkout, merged `--no-ff`. Pushing to `origin` is
approved for this repo as part of the design approval.

## 10. Definition of done

1. `npm test`, `npm run build`, and `node scripts/check-dist.mjs` pass locally and in CI.
2. All pages render at 360 / 768 / 1280 px with no horizontal scroll (screenshot check).
3. Donate, join, RSVP (incl. `.ics`), portal, and contact flows complete by keyboard and end
   in a demo confirmation with no network request.
4. Every one of the 44 audit findings is mapped in `docs/AUDIT-MAP.md` to a concrete fix.
5. README: what this is, ownership notice, run/build/deploy, "Club to confirm" list.
6. Deployed and reachable at the Pages URL.
