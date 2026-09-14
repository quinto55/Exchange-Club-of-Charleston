import { it, expect, beforeAll } from 'vitest';
import { loadPage } from './helpers/load-page.js';
import { meetingCardHtml } from '../src/js/lib/meeting-cards.js';
import { MEETINGS } from '../src/data/meetings.js';

beforeAll(() => loadPage('meetings.html'));

it('ships static meeting cards identical to the renderer output', () => {
  const list = document.querySelector('ul[data-meeting-list]');
  const expected = MEETINGS.map((m) => meetingCardHtml({ date: m.date, title: m.title, tentative: false })).join('');
  expect(list.innerHTML.replace(/>\s+</g, '><').trim()).toBe(expected);
});
