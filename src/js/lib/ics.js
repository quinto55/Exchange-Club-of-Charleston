import { meetingStart } from './dates.js';

const CRLF = '\r\n';
const pad = (n) => String(n).padStart(2, '0');
const encoder = new TextEncoder();

export function toIcsUtc(date) {
  return (
    `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}` +
    `T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`
  );
}

export function escapeIcs(text) {
  return String(text)
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

/** RFC 5545 folding: lines longer than 75 octets continue on lines starting with one space. */
export function foldLine(line) {
  if (encoder.encode(line).length <= 75) return line;
  const parts = [];
  let current = '';
  let bytes = 0;
  let limit = 75;
  for (const ch of line) {
    const size = encoder.encode(ch).length;
    if (bytes + size > limit) {
      parts.push(current);
      current = '';
      bytes = 0;
      limit = 74; // continuation lines spend one octet on the leading space
    }
    current += ch;
    bytes += size;
  }
  parts.push(current);
  return parts.join(`${CRLF} `);
}

/**
 * Calendar file for weekly meetings (one-hour events at noon Eastern, written in UTC).
 * @param {{date: string, title: string}[]} meetings
 * @param {{venue: string, address: string}} place
 */
export function buildMeetingsIcs(
  meetings,
  place,
  { now = new Date(), description = 'Weekly lunch meeting of the Exchange Club of Charleston. Guests welcome.' } = {},
) {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Exchange Club of Charleston//Demo site//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ];
  for (const m of meetings) {
    const start = meetingStart(m.date);
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    lines.push(
      'BEGIN:VEVENT',
      `UID:${m.date}-weekly-meeting@exchangeclubofcharleston.demo`,
      `DTSTAMP:${toIcsUtc(now)}`,
      `DTSTART:${toIcsUtc(start)}`,
      `DTEND:${toIcsUtc(end)}`,
      `SUMMARY:${escapeIcs(`Exchange Club of Charleston — ${m.title}`)}`,
      `LOCATION:${escapeIcs(`${place.venue}, ${place.address}`)}`,
      `DESCRIPTION:${escapeIcs(description)}`,
      'END:VEVENT',
    );
  }
  lines.push('END:VCALENDAR');
  return lines.map(foldLine).join(CRLF) + CRLF;
}

/** Download text as an .ics file (browser only; nothing leaves the device). */
export function downloadIcs(filename, text, doc = document) {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/calendar;charset=utf-8' }));
  const a = doc.createElement('a');
  a.href = url;
  a.download = filename;
  doc.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
