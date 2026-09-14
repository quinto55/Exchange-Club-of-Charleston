import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { loadPage } from './helpers/load-page.js';
import { validateRsvpChoice, validateRsvpDetails, rsvpSummary, mountRsvp, mountSubscribe } from '../src/js/flows/rsvp.js';

if (typeof globalThis.fetch === 'undefined') {
  globalThis.fetch = () => {
    throw new Error('fetch is not implemented in this test environment');
  };
}

const click = (el) => el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
const submit = (form) => form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
const now = () => new Date('2026-09-11T12:00:00-04:00');

describe('rsvp rules', () => {
  it('requires a meeting, a name and a valid email', () => {
    expect(validateRsvpChoice({ meeting: '' })).toEqual({ meeting: 'Choose a Thursday.' });
    expect(validateRsvpChoice({ meeting: '2026-10-01' })).toEqual({});
    expect(validateRsvpDetails({ name: ' ', email: 'x' })).toEqual({
      name: 'Enter your name.',
      email: 'Enter an email address like name@example.com.',
    });
    expect(validateRsvpDetails({ name: 'Sam', email: 'sam@example.com' })).toEqual({});
  });

  it('summarizes the booking', () => {
    expect(rsvpSummary({ meeting: '2026-10-01', guests: 2, name: ' Sam Lee ' })).toEqual({
      title: 'You’re on the list for Thursday, October 1, 2026',
      rows: [
        ['When', 'Thursday, October 1, 2026 · 12:00 PM'],
        ['Where', 'Charleston Rifle Club, 2221 Heriot St, Charleston, SC 29403'],
        ['Guests', '2 people'],
        ['Name', 'Sam Lee'],
      ],
    });
    expect(rsvpSummary({ meeting: '2026-10-01', guests: 1, name: 'A' }).rows[2]).toEqual(['Guests', '1 person']);
  });
});

describe('rsvp flow on the meetings page', () => {
  let form;
  let confirm;
  let download;
  let fetchSpy;
  beforeEach(() => {
    loadPage('meetings.html');
    fetchSpy = vi.spyOn(globalThis, 'fetch');
    download = vi.fn();
    form = document.querySelector('[data-flow="rsvp"]');
    confirm = document.querySelector('[data-confirm="rsvp"]');
    mountRsvp(form, { now, random: () => 0, download });
  });
  afterEach(() => fetchSpy.mockRestore());

  it('offers the next five Thursdays', () => {
    const values = [...form.querySelectorAll('input[name="meeting"]')].map((r) => r.value);
    expect(values).toEqual(['2026-09-17', '2026-10-01', '2026-10-08', '2026-10-15', '2026-11-05']);
  });

  it('blocks Continue until a date is chosen, then moves to details', () => {
    click(form.querySelector('[data-next]'));
    expect(form.querySelector('[data-error-for="meeting"]').textContent).toBe('Choose a Thursday.');
    expect(document.activeElement).toBe(form.querySelector('input[name="meeting"]'));
    form.querySelector('input[value="2026-10-01"]').checked = true;
    click(form.querySelector('[data-next]'));
    const [one, two] = form.querySelectorAll('[data-step]');
    expect(one.hidden).toBe(true);
    expect(two.hidden).toBe(false);
  });

  it('treats Enter on the first step as Continue, never as submit', () => {
    submit(form);
    expect(confirm.hidden).toBe(true);
    expect(form.querySelector('[data-error-for="meeting"]').hidden).toBe(false);
  });

  it('validates details, then confirms with a demo reference and a calendar file', () => {
    form.querySelector('input[value="2026-10-01"]').checked = true;
    form.querySelector('[name="guests"]').value = '2';
    click(form.querySelector('[data-next]'));
    submit(form);
    expect(form.querySelector('[data-error-for="name"]').hidden).toBe(false);
    expect(document.activeElement).toBe(form.querySelector('[name="name"]'));
    form.querySelector('[name="name"]').value = 'Sam <Lee>';
    form.querySelector('[name="email"]').value = 'sam@example.com';
    submit(form);
    expect(form.hidden).toBe(true);
    expect(confirm.hidden).toBe(false);
    expect(confirm.querySelector('[data-confirm-title]').textContent).toBe('You’re on the list for Thursday, October 1, 2026');
    expect(confirm.querySelector('[data-confirm-ref]').textContent).toBe('DEMO-AAAAAA');
    expect(confirm.textContent).toContain('Sam <Lee>');
    expect(confirm.textContent).toContain('2 people');
    click(confirm.querySelector('[data-add-calendar]'));
    expect(download).toHaveBeenCalledOnce();
    const [filename, ics] = download.mock.calls[0];
    expect(filename).toBe('exchange-club-meeting.ics');
    expect(ics).toContain('DTSTART:20261001T160000Z');
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('starts over from the first step', () => {
    form.querySelector('input[value="2026-10-01"]').checked = true;
    click(form.querySelector('[data-next]'));
    form.querySelector('[name="name"]').value = 'Sam';
    form.querySelector('[name="email"]').value = 'sam@example.com';
    submit(form);
    click(confirm.querySelector('[data-restart]'));
    expect(confirm.hidden).toBe(true);
    expect(form.hidden).toBe(false);
    expect(form.querySelector('[data-step]').hidden).toBe(false);
    expect(form.querySelector('input[name="meeting"]:checked')).toBeNull();
  });

  it('subscribes to every upcoming meeting in one file', () => {
    const subscribeDownload = vi.fn();
    mountSubscribe(document.querySelector('[data-subscribe]'), { now, download: subscribeDownload });
    click(document.querySelector('[data-subscribe]'));
    const [filename, ics] = subscribeDownload.mock.calls[0];
    expect(filename).toBe('exchange-club-meetings.ics');
    expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(5);
  });
});
