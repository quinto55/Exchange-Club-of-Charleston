const DAY_MS = 86_400_000;
const TZ = 'America/New_York';

/** UTC-midnight timestamp for a 'YYYY-MM-DD' string. */
function ymdToUtc(ymd) {
  const [y, m, d] = ymd.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
}

function addDays(ymd, days) {
  return new Date(ymdToUtc(ymd) + days * DAY_MS).toISOString().slice(0, 10);
}

/** UTC-midnight timestamp of the nth given weekday (0 = Sunday) of a month. */
function nthWeekday(year, monthIndex, weekday, n) {
  const firstDow = new Date(Date.UTC(year, monthIndex, 1)).getUTCDay();
  return Date.UTC(year, monthIndex, 1 + ((weekday - firstDow + 7) % 7) + (n - 1) * 7);
}

/** Eastern UTC offset on a calendar date (US DST: 2nd Sunday of March to 1st Sunday of November). */
export function easternOffset(ymd) {
  const year = Number(ymd.slice(0, 4));
  const t = ymdToUtc(ymd);
  return t >= nthWeekday(year, 2, 0, 2) && t < nthWeekday(year, 10, 0, 1) ? '-04:00' : '-05:00';
}

/** A meeting's start instant: local time (default noon) Eastern on the given date. */
export function meetingStart(ymd, time = '12:00') {
  return new Date(`${ymd}T${time}:00${easternOffset(ymd)}`);
}

/** Eastern calendar date of an instant, as 'YYYY-MM-DD'. */
export function easternYmd(date) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
}

/** First Thursday strictly after the given date. */
export function nextThursday(ymd) {
  const dow = new Date(ymdToUtc(ymd)).getUTCDay();
  return addDays(ymd, (4 - dow + 7) % 7 || 7);
}

/**
 * Meetings that start after `now`, soonest first. When fewer than `min` remain, pads with
 * generated Thursday-noon meetings (tentative: true) after the later of the last listed
 * meeting and today, so the list is never empty.
 */
export function upcomingMeetings(meetings, now, min = 3) {
  const list = meetings
    .map((m) => ({ ...m, tentative: false, start: meetingStart(m.date) }))
    .filter((m) => m.start > now)
    .sort((a, b) => a.start - b.start);
  let cursor = [meetings.map((m) => m.date).sort().at(-1), easternYmd(now)].filter(Boolean).sort().at(-1);
  while (list.length < min) {
    cursor = nextThursday(cursor);
    const start = meetingStart(cursor);
    if (start > now) list.push({ date: cursor, title: 'Weekly Club Meeting', guests: true, tentative: true, start });
  }
  return list;
}

/** Countdown phase relative to the fair's start and end instants. */
export function countdownState(now, start, end) {
  if (now < start) {
    let s = Math.floor((start - now) / 1000);
    const days = Math.floor(s / 86_400);
    s -= days * 86_400;
    const hours = Math.floor(s / 3_600);
    s -= hours * 3_600;
    const minutes = Math.floor(s / 60);
    return { phase: 'before', days, hours, minutes, seconds: s - minutes * 60 };
  }
  return now < end ? { phase: 'during' } : { phase: 'after' };
}

export function countdownText(state) {
  if (state.phase === 'during') return 'The fair is on — through Sunday, Nov 8';
  if (state.phase === 'after') return 'Thanks for a great 2026 fair — 2027 dates coming soon';
  const pad = (n) => String(n).padStart(2, '0');
  const days = `${state.days} ${state.days === 1 ? 'day' : 'days'}`;
  return `${days} · ${pad(state.hours)}:${pad(state.minutes)}:${pad(state.seconds)} until gates open`;
}

/** Display parts for a meeting date, formatted in Eastern time. */
export function meetingDateParts(ymd) {
  const d = meetingStart(ymd);
  const f = (opts) => new Intl.DateTimeFormat('en-US', { timeZone: TZ, ...opts }).format(d);
  return {
    month: f({ month: 'short' }).toUpperCase(),
    day: f({ day: 'numeric' }),
    weekday: f({ weekday: 'long' }),
    short: f({ weekday: 'short', month: 'short', day: 'numeric' }),
    long: f({ weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }),
  };
}
