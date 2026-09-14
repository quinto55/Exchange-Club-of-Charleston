import { describe, it, expect, beforeEach } from 'vitest';
import { loadPage } from './helpers/load-page.js';
import { SHIFTS, ROSTER } from '../src/data/portal-demo.js';
import {
  PORTAL_SESSION_KEY, PORTAL_STATE_KEY, initialPortalState, shiftCount, isFull, toggleShift, toggleCommittee, filterRoster, mountPortal,
} from '../src/js/flows/portal.js';

const memory = () => {
  const map = new Map();
  return { getItem: (k) => (map.has(k) ? map.get(k) : null), setItem: (k, v) => map.set(k, String(v)), removeItem: (k) => map.delete(k) };
};
const click = (el) => el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
const byId = (id) => SHIFTS.find((s) => s.id === id);

describe('portal state', () => {
  it('starts with the demo member\'s committee and no shifts', () => {
    expect(initialPortalState()).toEqual({ shifts: [], committees: ['Fair Operations'] });
  });

  it('signs up for and withdraws from shifts, respecting capacity', () => {
    const start = initialPortalState();
    const signed = toggleShift(start, 'opening-gate');
    expect(signed.shifts).toEqual(['opening-gate']);
    expect(shiftCount(byId('opening-gate'), signed)).toBe(6);
    expect(toggleShift(signed, 'opening-gate').shifts).toEqual([]);
    expect(isFull(byId('workday-oct-17'), start)).toBe(true);
    expect(toggleShift(start, 'workday-oct-17')).toBe(start);
    expect(start.shifts).toEqual([]);
  });

  it('joins and leaves committees without mutating state', () => {
    const start = initialPortalState();
    const joined = toggleCommittee(start, 'Scholarship');
    expect(joined.committees).toEqual(['Fair Operations', 'Scholarship']);
    expect(toggleCommittee(joined, 'Fair Operations').committees).toEqual(['Scholarship']);
    expect(start.committees).toEqual(['Fair Operations']);
  });

  it('filters the roster by name or committee, case-insensitively', () => {
    expect(filterRoster(ROSTER, '')).toHaveLength(24);
    expect(filterRoster(ROSTER, 'bell').map((m) => m.name)).toEqual(['Marcus Bell']);
    expect(filterRoster(ROSTER, 'FELLOWSHIP')).toHaveLength(4);
  });
});

describe('portal page', () => {
  let session;
  let storage;
  const mount = () => mountPortal(document.querySelector('[data-portal]'), { session, storage });
  beforeEach(() => {
    loadPage('portal.html');
    session = memory();
    storage = memory();
  });

  it('shows the gate with no password field, then enters the dashboard', () => {
    mount();
    expect(document.querySelector('[data-portal-gate]').hidden).toBe(false);
    expect(document.querySelector('input[type="password"]')).toBeNull();
    click(document.querySelector('[data-portal-enter]'));
    expect(session.getItem(PORTAL_SESSION_KEY)).toBe('demo');
    expect(document.querySelector('[data-portal-dash]').hidden).toBe(false);
    expect(document.activeElement).toBe(document.querySelector('[data-portal-welcome]'));
    expect(document.querySelectorAll('[data-shifts] li')).toHaveLength(6);
    expect(document.querySelectorAll('[data-roster] li')).toHaveLength(24);
    expect(document.querySelector('[data-roster-count]').textContent).toBe('24 members');
  });

  it('remembers the demo session and saved shifts', () => {
    session.setItem(PORTAL_SESSION_KEY, 'demo');
    storage.setItem(PORTAL_STATE_KEY, JSON.stringify({ shifts: ['senior-day'], committees: ['Programs'] }));
    mount();
    expect(document.querySelector('[data-portal-dash]').hidden).toBe(false);
    expect(document.querySelector('[data-shift="senior-day"]').textContent).toBe('Withdraw');
    expect(document.querySelector('[data-committee="Programs"]').checked).toBe(true);
  });

  it('signs up for a shift, saves it and keeps focus on the button', () => {
    session.setItem(PORTAL_SESSION_KEY, 'demo');
    mount();
    click(document.querySelector('[data-shift="opening-gate"]'));
    const button = document.querySelector('[data-shift="opening-gate"]');
    expect(button.textContent).toBe('Withdraw');
    expect(document.activeElement).toBe(button);
    expect(JSON.parse(storage.getItem(PORTAL_STATE_KEY)).shifts).toEqual(['opening-gate']);
    expect(document.querySelector('[data-shift="workday-oct-17"]').disabled).toBe(true);
  });

  it('filters the roster and resets or signs out', () => {
    session.setItem(PORTAL_SESSION_KEY, 'demo');
    mount();
    const filter = document.querySelector('[data-roster-filter]');
    filter.value = 'scholar';
    filter.dispatchEvent(new Event('input', { bubbles: true }));
    expect(document.querySelectorAll('[data-roster] li')).toHaveLength(4);
    expect(document.querySelector('[data-roster-count]').textContent).toBe('4 of 24 members');
    click(document.querySelector('[data-shift="opening-gate"]'));
    click(document.querySelector('[data-portal-reset]'));
    expect(storage.getItem(PORTAL_STATE_KEY)).toBeNull();
    expect(document.querySelector('[data-shift="opening-gate"]').textContent).toBe('Sign up');
    click(document.querySelector('[data-portal-signout]'));
    expect(session.getItem(PORTAL_SESSION_KEY)).toBeNull();
    expect(document.querySelector('[data-portal-gate]').hidden).toBe(false);
  });

  it('mounts with null session and storage, and clicking continue reveals the dashboard', () => {
    mountPortal(document.querySelector('[data-portal]'), { session: null, storage: null });
    expect(document.querySelector('[data-portal-gate]').hidden).toBe(false);
    click(document.querySelector('[data-portal-enter]'));
    expect(document.querySelector('[data-portal-dash]').hidden).toBe(false);
    expect(document.querySelectorAll('[data-shifts] li')).toHaveLength(6);
  });
});
