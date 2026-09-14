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
