import { describe, it, expect } from 'vitest';
import { readJson, writeJson, removeKey } from '../src/js/lib/storage.js';

const memory = () => {
  const map = new Map();
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: (k) => map.delete(k),
  };
};
const broken = {
  getItem() { throw new Error('denied'); },
  setItem() { throw new Error('denied'); },
  removeItem() { throw new Error('denied'); },
};

describe('storage', () => {
  it('round-trips JSON', () => {
    const store = memory();
    expect(writeJson(store, 'k', { a: 1 })).toBe(true);
    expect(readJson(store, 'k', null)).toEqual({ a: 1 });
  });

  it('returns the fallback for missing or invalid values', () => {
    const store = memory();
    expect(readJson(store, 'none', 'fb')).toBe('fb');
    store.setItem('bad', '{');
    expect(readJson(store, 'bad', 'fb')).toBe('fb');
  });

  it('survives a store that throws', () => {
    expect(readJson(broken, 'k', 'fb')).toBe('fb');
    expect(writeJson(broken, 'k', 1)).toBe(false);
    expect(() => removeKey(broken, 'k')).not.toThrow();
  });

  it('removes keys', () => {
    const store = memory();
    writeJson(store, 'k', 1);
    removeKey(store, 'k');
    expect(readJson(store, 'k', null)).toBeNull();
  });
});
