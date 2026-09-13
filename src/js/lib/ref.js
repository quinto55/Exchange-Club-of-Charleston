// No I, O, 0 or 1 — references are read aloud and retyped.
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/** Demo confirmation reference, e.g. DEMO-7KQ2MX. */
export function demoRef(random = Math.random) {
  let s = '';
  for (let i = 0; i < 6; i += 1) s += ALPHABET[Math.floor(random() * ALPHABET.length)];
  return `DEMO-${s}`;
}
