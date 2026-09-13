import { describe, it, expect } from 'vitest';
import { isFilled, isEmail, parseAmount, isValidAmount, isUsPhone, formatUSD } from '../src/js/lib/validate.js';

describe('validate', () => {
  it('isFilled trims whitespace and rejects non-strings', () => {
    expect(isFilled('  a ')).toBe(true);
    expect(isFilled('   ')).toBe(false);
    expect(isFilled(undefined)).toBe(false);
  });

  it('isEmail', () => {
    expect(isEmail('a@b.co')).toBe(true);
    expect(isEmail(' a@b.co ')).toBe(true);
    expect(isEmail('a@b')).toBe(false);
    expect(isEmail('a b@c.d')).toBe(false);
  });

  it('parseAmount accepts whole dollars with $ and commas only', () => {
    expect(parseAmount('$1,250')).toBe(1250);
    expect(parseAmount(' 75 ')).toBe(75);
    expect(parseAmount('12.50')).toBeNaN();
    expect(parseAmount('')).toBeNaN();
    expect(parseAmount('-5')).toBeNaN();
  });

  it('isValidAmount enforces $5 – $100,000', () => {
    expect(isValidAmount(5)).toBe(true);
    expect(isValidAmount(100000)).toBe(true);
    expect(isValidAmount(4)).toBe(false);
    expect(isValidAmount(100001)).toBe(false);
    expect(isValidAmount(Number.NaN)).toBe(false);
  });

  it('isUsPhone accepts 10 digits or 11 starting with 1', () => {
    expect(isUsPhone('(843) 555-0142')).toBe(true);
    expect(isUsPhone('1-843-555-0142')).toBe(true);
    expect(isUsPhone('555-0142')).toBe(false);
    expect(isUsPhone('2-843-555-0142')).toBe(false);
  });

  it('formatUSD has no cents', () => {
    expect(formatUSD(1250)).toBe('$1,250');
    expect(formatUSD(50)).toBe('$50');
  });
});
