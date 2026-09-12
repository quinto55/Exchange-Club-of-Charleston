import { it, expect } from 'vitest';
import { demoRef } from '../src/js/lib/ref.js';

it('is DEMO- plus six unambiguous characters', () => {
  expect(demoRef()).toMatch(/^DEMO-[A-HJ-NP-Z2-9]{6}$/);
});

it('uses the supplied random source', () => {
  expect(demoRef(() => 0)).toBe('DEMO-AAAAAA');
  expect(demoRef(() => 0.9999)).toBe('DEMO-999999');
});
