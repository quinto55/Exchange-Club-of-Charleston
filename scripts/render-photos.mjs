#!/usr/bin/env node
// Writes hotlinked photo grids into gallery.html and the story pages, between marker comments.
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { ALBUMS, PHOTO_BASE, STORY_PHOTOS } from '../src/data/gallery.js';
import { STORIES } from '../src/data/stories.js';

const esc = (s) => s.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;');

export const thumbUrl = (album, file) => `${PHOTO_BASE}/thumb/PhotoAlbum/${album}/${encodeURI(file)}`;
export const fullUrl = (album, file) => `${PHOTO_BASE}/PhotoAlbum/${album}/${encodeURI(file)}`;

export function photoGridHtml(photos, label, { dense = false } = {}) {
  const items = photos.map(
    (p, i) =>
      `<li><a class="photo-grid__link" href="${fullUrl(p.album, p.file)}" data-lightbox>` +
      `<img src="${thumbUrl(p.album, p.file)}" width="${p.w}" height="${p.h}" loading="lazy" decoding="async" ` +
      `alt="${esc(`Photo ${i + 1} of ${photos.length} — ${label}`)}"></a></li>`,
  );
  return `<ul class="photo-grid${dense ? ' photo-grid--dense' : ''}" data-lightbox-group>${items.join('')}</ul>`;
}

export function albumHtml(album) {
  const photos = album.photos.map((p) => ({ ...p, album: album.slug }));
  return (
    `<section class="album" aria-labelledby="album-${album.slug}">` +
    `<h2 id="album-${album.slug}">${esc(album.title)}</h2>` +
    `<p class="album__meta">${photos.length} photos</p>` +
    `${photoGridHtml(photos, album.title, { dense: true })}</section>`
  );
}

export function replaceBetween(html, name, content) {
  const markers = new RegExp(`(<!-- photos:${name} -->)[\\s\\S]*?(<!-- /photos:${name} -->)`);
  if (!markers.test(html)) throw new Error(`render-photos: markers for "${name}" not found`);
  return html.replace(markers, (_, open, close) => open + content + close);
}

function main() {
  const root = resolve(import.meta.dirname, '..');
  const update = (file, name, content) => {
    const path = resolve(root, file);
    writeFileSync(path, replaceBetween(readFileSync(path, 'utf8'), name, content));
  };
  update('gallery.html', 'gallery', ALBUMS.map(albumHtml).join(''));
  for (const story of STORIES) update(`${story.slug}.html`, 'story', photoGridHtml(STORY_PHOTOS[story.slug], story.title));
  console.log(`rendered ${ALBUMS.length} albums and ${STORIES.length} story grids`);
}

if (process.argv[1] && resolve(process.argv[1]) === import.meta.filename) main();
