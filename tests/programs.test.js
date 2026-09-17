import { describe, it, expect, beforeAll } from 'vitest';
import { loadPage } from './helpers/load-page.js';

const ids = ['child-abuse-prevention', 'patriotism', 'youth', 'community-service'];

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
