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
