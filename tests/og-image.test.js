import { it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

it('ships a 1200×630 PNG share image', () => {
  const png = readFileSync(resolve(import.meta.dirname, '../public/og/og-default.png'));
  expect(png.subarray(1, 4).toString('ascii')).toBe('PNG');
  expect(png.readUInt32BE(16)).toBe(1200);
  expect(png.readUInt32BE(20)).toBe(630);
});
