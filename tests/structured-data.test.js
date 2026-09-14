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
