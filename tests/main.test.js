import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadPage } from './helpers/load-page.js';
import { initMenu, nextMeetingText, initNextMeeting, initCountdowns, initMeetingLists } from '../src/js/main.js';

describe('site shell', () => {
  beforeEach(() => loadPage('index.html'));

  it('toggles the mobile menu and closes it with Escape', () => {
    initMenu(document);
    const toggle = document.querySelector('[data-menu-toggle]');
    const header = document.querySelector('[data-site-header]');
    toggle.click();
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(header.hasAttribute('data-open')).toBe(true);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(header.hasAttribute('data-open')).toBe(false);
    expect(document.activeElement).toBe(toggle);
  });

  it('writes the next meeting into the utility bar', () => {
    expect(nextMeetingText(new Date('2026-09-11T12:00:00-04:00'))).toBe(
      'Next meeting: Thu, Sep 17 · 12:00 PM · Charleston Rifle Club',
    );
    initNextMeeting(document, new Date('2026-09-18T12:00:00-04:00'));
    expect(document.querySelector('[data-next-meeting]').textContent).toBe(
      'Next meeting: Thu, Oct 1 · 12:00 PM · Charleston Rifle Club',
    );
  });

  it('fills countdowns and can stop the timer', () => {
    document.body.insertAdjacentHTML('beforeend', '<p data-countdown>fallback</p>');
    const win = { setInterval: vi.fn(() => 7), clearInterval: vi.fn() };
    const stop = initCountdowns(document, () => new Date('2026-10-27T13:59:30-04:00'), win);
    expect(document.querySelector('[data-countdown]').textContent).toBe('2 days · 01:00:30 until gates open');
    expect(win.setInterval).toHaveBeenCalledOnce();
    stop();
    expect(win.clearInterval).toHaveBeenCalledWith(7);
  });

  it('renders upcoming meetings into [data-meeting-list]', () => {
    document.body.insertAdjacentHTML('beforeend', '<ul class="place-list" data-meeting-list data-limit="2"></ul>');
    const list = document.body.lastElementChild;
    initMeetingLists(document, new Date('2026-10-02T12:00:00-04:00'));
    const cards = list.querySelectorAll('.place-card');
    expect(cards).toHaveLength(2);
    expect(cards[0].textContent).toContain('Thursday, October 8, 2026');
    expect(cards[0].querySelector('a').getAttribute('href')).toBe('meetings.html#rsvp');
  });
});
