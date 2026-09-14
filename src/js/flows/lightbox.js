export const nextIndex = (i, n, dir) => (i + dir + n) % n;

/** Progressive-enhancement photo viewer: without JS the thumbnail links open the full-size image. */
export function mountLightbox(root, doc = document) {
  const dialog = doc.querySelector('[data-lightbox-dialog]');
  if (!root || !dialog) return;
  const img = dialog.querySelector('[data-lightbox-img]');
  const caption = dialog.querySelector('[data-lightbox-caption]');
  let group = [];
  let index = 0;
  let opener = null;

  const show = (i) => {
    index = i;
    const link = group[i];
    img.src = link.getAttribute('href');
    img.alt = link.querySelector('img')?.getAttribute('alt') ?? '';
    caption.textContent = `${i + 1} of ${group.length}`;
  };
  const step = (dir) => show(nextIndex(index, group.length, dir));

  const restoreFocus = () => opener?.focus();

  root.addEventListener('click', (event) => {
    const link = event.target.closest('a[data-lightbox]');
    if (!link) return;
    event.preventDefault();
    group = [...(link.closest('[data-lightbox-group]') ?? root).querySelectorAll('a[data-lightbox]')];
    opener = link;
    show(group.indexOf(link));
    if (!dialog.open) {
      // Focus the thumbnail before showModal() so the browser's own dialog
      // focus-restoration returns focus here even when the click that opened
      // the viewer did not itself focus the link (e.g. some assistive tech
      // and Safari mouse activations).
      link.focus();
      dialog.showModal();
    }
  });
  dialog.querySelector('[data-lightbox-prev]').addEventListener('click', () => step(-1));
  dialog.querySelector('[data-lightbox-next]').addEventListener('click', () => step(1));
  dialog.querySelector('[data-lightbox-close]').addEventListener('click', () => {
    dialog.close();
    restoreFocus();
  });
  dialog.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') step(-1);
    if (event.key === 'ArrowRight') step(1);
  });
  // `cancel` fires on Escape; restore focus explicitly here rather than relying
  // solely on `close`, which does not observably fire in real Chrome for a
  // dialog closed via Escape.
  dialog.addEventListener('cancel', restoreFocus);
  dialog.addEventListener('close', restoreFocus);
}
