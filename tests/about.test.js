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
