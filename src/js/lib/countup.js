/**
 * Counting the impact figures up on first view. The figures are written as display
 * strings ("$504K+", "15,000+"), so each is split into the parts around its number
 * and reassembled every frame — the last frame is the original text, exactly.
 */

const FIGURE = /^([^\d]*)([\d,]+)(.*)$/;

/** Split a display figure into prefix / number / suffix, or null if there is no number. */
export function splitFigure(text) {
  const match = FIGURE.exec(String(text).trim());
  if (!match) return null;
  const [, prefix, digits, suffix] = match;
  return { prefix, value: Number(digits.replace(/,/g, '')), suffix, grouped: digits.includes(',') };
}

/** The figure as it should read at `progress` (0 to 1) through the count. */
export function frameText(parts, progress) {
  const n = Math.round(parts.value * Math.min(Math.max(progress, 0), 1));
  const shown = parts.grouped ? n.toLocaleString('en-US') : String(n);
  return `${parts.prefix}${shown}${parts.suffix}`;
}

const easeOut = (t) => 1 - (1 - t) ** 3;

/** Animate one element from zero to its written figure. */
export function countUp(el, { duration = 1100, now = () => performance.now(), raf = requestAnimationFrame } = {}) {
  const parts = splitFigure(el.textContent);
  if (!parts) return;
  const start = now();
  const tick = () => {
    const progress = Math.min((now() - start) / duration, 1);
    el.textContent = frameText(parts, easeOut(progress));
    if (progress < 1) raf(tick);
  };
  raf(tick);
}

/**
 * Count each figure up the first time it scrolls into view. Skips entirely when the
 * reader prefers reduced motion, or when the browser has no IntersectionObserver —
 * in both cases the figures simply stay as written.
 */
export function mountCountUp(root, { win = window } = {}) {
  if (!root) return;
  const targets = [...root.querySelectorAll('[data-countup]')];
  if (!targets.length) return;
  if (win.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
  if (typeof win.IntersectionObserver !== 'function') return;

  const observer = new win.IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        observer.unobserve(entry.target);
        countUp(entry.target);
      }
    },
    { threshold: 0.4 },
  );
  for (const el of targets) observer.observe(el);
}
