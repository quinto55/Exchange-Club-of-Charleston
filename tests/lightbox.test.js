import { describe, it, expect, beforeEach } from 'vitest';
import { loadPage } from './helpers/load-page.js';
import { mountLightbox, nextIndex } from '../src/js/flows/lightbox.js';

const click = (el) => el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));

describe('lightbox', () => {
  let dialog;
  let img;
  let caption;
  beforeEach(() => {
    loadPage('gallery.html');
    mountLightbox(document.querySelector('main'));
    dialog = document.querySelector('[data-lightbox-dialog]');
    img = document.querySelector('[data-lightbox-img]');
    caption = document.querySelector('[data-lightbox-caption]');
  });

  it('wraps around at both ends', () => {
    expect(nextIndex(0, 5, -1)).toBe(4);
    expect(nextIndex(4, 5, 1)).toBe(0);
  });

  it('opens the full-size photo with a counter scoped to its album', () => {
    const first = document.querySelector('a[data-lightbox]');
    click(first);
    expect(dialog.open).toBe(true);
    expect(img.getAttribute('src')).toBe(first.getAttribute('href'));
    const albumSize = first.closest('[data-lightbox-group]').querySelectorAll('a[data-lightbox]').length;
    expect(caption.textContent).toBe(`1 of ${albumSize}`);
  });

  it('steps with the buttons and the arrow keys, wrapping within the album', () => {
    const links = [...document.querySelector('[data-lightbox-group]').querySelectorAll('a[data-lightbox]')];
    click(links[0]);
    click(dialog.querySelector('[data-lightbox-prev]'));
    expect(img.getAttribute('src')).toBe(links.at(-1).getAttribute('href'));
    dialog.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    expect(img.getAttribute('src')).toBe(links[0].getAttribute('href'));
    click(dialog.querySelector('[data-lightbox-next]'));
    expect(img.getAttribute('src')).toBe(links[1].getAttribute('href'));
  });

  it('returns focus to the thumbnail when closed', () => {
    const first = document.querySelector('a[data-lightbox]');
    click(first);
    click(dialog.querySelector('[data-lightbox-close]'));
    expect(dialog.open).toBe(false);
    expect(document.activeElement).toBe(first);
  });

  it('returns focus to the thumbnail on close even when nothing was focused when it opened', () => {
    const first = document.querySelector('a[data-lightbox]');
    document.activeElement?.blur();
    expect(document.activeElement).toBe(document.body);
    click(first);
    click(dialog.querySelector('[data-lightbox-close]'));
    expect(dialog.open).toBe(false);
    expect(document.activeElement).toBe(first);
  });

  it('returns focus to the thumbnail when the dialog is cancelled (Escape)', () => {
    const first = document.querySelector('a[data-lightbox]');
    click(first);
    dialog.dispatchEvent(new Event('cancel', { bubbles: true, cancelable: true }));
    // The cancel handler itself must restore focus — real browsers don't reliably
    // fire `close` after `cancel`, so this can't depend on the `close` listener.
    expect(document.activeElement).toBe(first);
    dialog.close();
    expect(dialog.open).toBe(false);
    expect(document.activeElement).toBe(first);
  });
});
