import { describe, it, expect } from 'vitest';
import {
  easternOffset,
  meetingStart,
  easternYmd,
  nextThursday,
  upcomingMeetings,
  countdownState,
  countdownText,
  meetingDateParts,
} from '../src/js/lib/dates.js';
import { MEETINGS } from '../src/data/meetings.js';
import { FAIR } from '../src/data/club.js';

describe('easternOffset', () => {
  it('uses EDT from the 2nd Sunday of March until the 1st Sunday of November', () => {
    expect(easternOffset('2026-03-07')).toBe('-05:00');
    expect(easternOffset('2026-03-08')).toBe('-04:00');
    expect(easternOffset('2026-10-31')).toBe('-04:00');
    expect(easternOffset('2026-11-01')).toBe('-05:00');
    expect(easternOffset('2026-11-05')).toBe('-05:00');
  });
});

describe('meetingStart', () => {
  it('is noon Eastern on either side of the DST change', () => {
    expect(meetingStart('2026-09-17').toISOString()).toBe('2026-09-17T16:00:00.000Z');
    expect(meetingStart('2026-11-05').toISOString()).toBe('2026-11-05T17:00:00.000Z');
  });
});

describe('easternYmd', () => {
  it('uses the Eastern calendar date, not UTC', () => {
    expect(easternYmd(new Date('2026-09-12T02:00:00Z'))).toBe('2026-09-11');
  });
});

describe('nextThursday', () => {
  it('returns the following Thursday and never the same day', () => {
    expect(nextThursday('2026-09-11')).toBe('2026-09-17');
    expect(nextThursday('2026-09-17')).toBe('2026-09-24');
  });
});

describe('upcomingMeetings', () => {
  it('drops past meetings and sorts the rest', () => {
    const list = upcomingMeetings(MEETINGS, new Date('2026-10-02T12:00:00-04:00'));
    expect(list.map((m) => m.date)).toEqual(['2026-10-08', '2026-10-15', '2026-11-05']);
    expect(list.every((m) => m.tentative === false)).toBe(true);
  });

  it('treats a meeting as past once it has started', () => {
    expect(upcomingMeetings(MEETINGS, new Date('2026-09-17T12:30:00-04:00'))[0].date).toBe('2026-10-01');
  });

  it('pads with tentative Thursdays after the last listed meeting', () => {
    const list = upcomingMeetings(MEETINGS, new Date('2026-11-01T09:00:00-05:00'));
    expect(list.map((m) => [m.date, m.tentative])).toEqual([
      ['2026-11-05', false],
      ['2026-11-12', true],
      ['2026-11-19', true],
    ]);
  });

  it('pads from today when every listed meeting is past', () => {
    const list = upcomingMeetings(MEETINGS, new Date('2027-02-01T09:00:00-05:00'));
    expect(list.map((m) => m.date)).toEqual(['2027-02-04', '2027-02-11', '2027-02-18']);
    expect(list.every((m) => m.tentative)).toBe(true);
  });

  it('returns start Dates', () => {
    expect(upcomingMeetings(MEETINGS, new Date('2026-09-11T12:00:00-04:00'))[0].start).toBeInstanceOf(Date);
  });
});

describe('countdown', () => {
  const start = new Date(FAIR.start);
  const end = new Date(FAIR.end);

  it('counts down before the fair', () => {
    const state = countdownState(new Date('2026-10-27T13:59:30-04:00'), start, end);
    expect(state).toEqual({ phase: 'before', days: 2, hours: 1, minutes: 0, seconds: 30 });
    expect(countdownText(state)).toBe('2 days · 01:00:30 until gates open');
  });

  it('uses the singular for one day', () => {
    expect(countdownText(countdownState(new Date('2026-10-28T15:00:00-04:00'), start, end))).toBe(
      '1 day · 00:00:00 until gates open',
    );
  });

  it('reports during and after', () => {
    const during = countdownState(new Date('2026-11-01T12:00:00-05:00'), start, end);
    expect(during).toEqual({ phase: 'during' });
    expect(countdownText(during)).toBe('The fair is on — through Sunday, Nov 8');
    const after = countdownState(new Date('2026-11-08T21:00:00-05:00'), start, end);
    expect(after).toEqual({ phase: 'after' });
    expect(countdownText(after)).toBe('Thanks for a great 2026 fair — 2027 dates coming soon');
  });
});

describe('meetingDateParts', () => {
  it('formats a meeting date in Eastern time', () => {
    expect(meetingDateParts('2026-09-17')).toEqual({
      month: 'SEP',
      day: '17',
      weekday: 'Thursday',
      short: 'Thu, Sep 17',
      long: 'Thursday, September 17, 2026',
    });
  });
});
