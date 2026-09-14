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
