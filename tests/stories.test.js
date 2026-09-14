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
