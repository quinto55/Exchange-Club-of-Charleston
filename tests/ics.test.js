import { describe, it, expect } from 'vitest';
import { buildMeetingsIcs, toIcsUtc, escapeIcs, foldLine } from '../src/js/lib/ics.js';
import { CLUB } from '../src/data/club.js';

const now = new Date('2026-09-11T20:00:00Z');
const meeting = (date) => ({ date, title: 'Weekly Club Meeting' });

describe('ics', () => {
  it('formats UTC timestamps', () => {
    expect(toIcsUtc(new Date('2026-09-17T16:00:00Z'))).toBe('20260917T160000Z');
  });

  it('escapes text values', () => {
    expect(escapeIcs('a, b; c\\d\ne')).toBe('a\\, b\\; c\\\\d\\ne');
  });

  it('builds one VEVENT per meeting with a one-hour noon slot', () => {
    const ics = buildMeetingsIcs([meeting('2026-09-17'), meeting('2026-11-05')], CLUB.meeting, { now });
    expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(2);
    expect(ics).toContain('DTSTART:20260917T160000Z');
    expect(ics).toContain('DTEND:20260917T170000Z');
    expect(ics).toContain('DTSTART:20261105T170000Z');
    expect(ics).toContain('DTSTAMP:20260911T200000Z');
    expect(ics).toContain('UID:2026-09-17-weekly-meeting@exchangeclubofcharleston.demo');
    expect(ics.startsWith('BEGIN:VCALENDAR\r\nVERSION:2.0\r\n')).toBe(true);
    expect(ics.endsWith('END:VCALENDAR\r\n')).toBe(true);
  });

  it('escapes the location and folds every line to 75 octets', () => {
    const ics = buildMeetingsIcs([meeting('2026-09-17')], CLUB.meeting, { now });
    expect(ics.replace(/\r\n /g, '')).toContain(
      'LOCATION:Charleston Rifle Club\\, 2221 Heriot St\\, Charleston\\, SC 29403',
    );
    for (const line of ics.split('\r\n')) {
      expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75);
    }
  });

  it('foldLine leaves short lines alone', () => {
    expect(foldLine('SUMMARY:Hi')).toBe('SUMMARY:Hi');
  });
});
