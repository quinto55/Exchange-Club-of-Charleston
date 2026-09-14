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
| 42 | The logo weighs 773 KB | Costly | Emblem served as 160 px and 320 px WebP (19 KB and 58 KB) instead of one 773 KB file | footer, `src/assets/img/` |
| 43 | Script stack from another decade | Polish | Zero runtime dependencies; a few small ES modules | `src/js/` |
| 44 | Assets aren’t cached | Polish | Content-hashed asset filenames, safe to cache for a year (cache headers are a host setting at launch) | `dist/assets/` |
