import { describe, it, expect } from 'vitest';
import { splitFigure, frameText } from '../src/js/lib/countup.js';

describe('splitFigure', () => {
  it('separates the prefix, number and suffix of the figures used on the home page', () => {
    expect(splitFigure('$11M+')).toEqual({ prefix: '$', value: 11, suffix: 'M+', grouped: false });
    expect(splitFigure('$504K+')).toEqual({ prefix: '$', value: 504, suffix: 'K+', grouped: false });
    expect(splitFigure('~$50K')).toEqual({ prefix: '~$', value: 50, suffix: 'K', grouped: false });
    expect(splitFigure('15,000+')).toEqual({ prefix: '', value: 15000, suffix: '+', grouped: true });
  });

  it('returns null when there is no number to animate', () => {
    expect(splitFigure('Dues')).toBeNull();
    expect(splitFigure('')).toBeNull();
  });
});

describe('frameText', () => {
  it('rebuilds the figure at a point through the animation', () => {
    const parts = splitFigure('15,000+');
    expect(frameText(parts, 0)).toBe('0+');
    expect(frameText(parts, 1)).toBe('15,000+');
    expect(frameText(parts, 0.5)).toBe('7,500+');
  });

  it('keeps the prefix and suffix at every frame', () => {
    const parts = splitFigure('~$50K');
    expect(frameText(parts, 0)).toBe('~$0K');
    expect(frameText(parts, 1)).toBe('~$50K');
  });

  it('lands exactly on the target so the final frame matches the source text', () => {
    for (const text of ['$11M+', '$504K+', '~$50K', '15,000+']) {
      expect(frameText(splitFigure(text), 1)).toBe(text);
    }
  });
});
