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
