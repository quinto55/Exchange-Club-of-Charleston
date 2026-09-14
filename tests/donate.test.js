import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { loadPage } from './helpers/load-page.js';
import { fundFromQuery, giftAmount, validateGift, validateDetails, donationSummary, mountDonate } from '../src/js/flows/donate.js';

const click = (el) => el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
const change = (el) => el.dispatchEvent(new Event('change', { bubbles: true }));
const submit = (form) => form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
const base = { fund: 'general', amount: 250, custom: '', frequency: 'once', tributeOn: false, tributeType: 'honor', tributeName: '', first: 'Ann', last: 'Lee', email: 'ann@example.com' };

describe('donation rules', () => {
  it('reads the fund from the query string, defaulting to general', () => {
    expect(fundFromQuery('?fund=scholarships')).toBe('scholarships');
    expect(fundFromQuery('?fund=bogus')).toBe('general');
    expect(fundFromQuery('')).toBe('general');
  });

  it('accepts presets and whole-dollar custom amounts from $5 to $100,000', () => {
    expect(giftAmount(base)).toBe(250);
    expect(validateGift(base)).toEqual({});
    expect(giftAmount({ ...base, amount: 'custom', custom: '$1,250' })).toBe(1250);
    expect(validateGift({ ...base, amount: 'custom', custom: '4' })).toEqual({ custom: 'Enter a whole-dollar amount between $5 and $100,000.' });
    expect(validateGift({ ...base, amount: 'custom', custom: '12.50' })).toHaveProperty('custom');
  });

  it('requires names, a valid email and a dedication name when dedicating', () => {
    expect(validateDetails(base)).toEqual({});
    expect(validateDetails({ ...base, first: '', last: ' ', email: 'no' })).toEqual({
      first: 'Enter your first name.',
      last: 'Enter your last name.',
      email: 'Enter an email address like name@example.com.',
    });
    expect(validateDetails({ ...base, tributeOn: true })).toEqual({ tributeName: 'Enter the name of the person you’re honoring.' });
  });

  it('summarizes one-time and monthly gifts', () => {
    expect(donationSummary(base)).toEqual({ fund: 'Where it’s needed most', line: '$250 one-time', tribute: null });
    expect(donationSummary({ ...base, fund: 'scholarships', amount: 100, frequency: 'monthly', tributeOn: true, tributeType: 'memory', tributeName: ' Pat ' })).toEqual({
      fund: 'Scholarships',
      line: '$100 per month ($1,200 per year)',
      tribute: 'In memory of Pat',
    });
  });
});

describe('donate flow on the give page', () => {
  let form;
  let confirm;
  let fetchSpy;
  beforeEach(() => {
    loadPage('give.html');
    fetchSpy = vi.spyOn(globalThis, 'fetch');
    form = document.querySelector('[data-flow="donate"]');
    confirm = document.querySelector('[data-confirm="donate"]');
    mountDonate(form, { search: '?fund=scholarships', random: () => 0, now: () => new Date('2026-09-12T15:00:00-04:00') });
  });
  afterEach(() => fetchSpy.mockRestore());

  it('preselects the fund from the link and has no card fields anywhere', () => {
    expect(form.querySelector('input[name="fund"]:checked').value).toBe('scholarships');
    expect(document.querySelector('input[autocomplete^="cc-"]')).toBeNull();
    expect([...document.querySelectorAll('input')].some((input) => /card/i.test(input.name))).toBe(false);
  });

  it('reveals the custom amount and validates it', () => {
    const other = form.querySelector('input[name="amount"][value="custom"]');
    other.checked = true;
    change(other);
    expect(form.querySelector('[data-custom-field]').hidden).toBe(false);
    form.querySelector('[name="custom"]').value = '3';
    click(form.querySelector('[data-step]:not([hidden]) [data-next]'));
    expect(form.querySelector('[data-error-for="custom"]').hidden).toBe(false);
    expect(document.activeElement).toBe(form.querySelector('[name="custom"]'));
  });

  it('never skips validation when Enter submits an early step', () => {
    submit(form);
    expect(confirm.hidden).toBe(true);
    expect(form.querySelectorAll('[data-step]')[1].hidden).toBe(false);
  });

  it('walks gift → details → review → demo receipt', () => {
    click(form.querySelector('[data-step]:not([hidden]) [data-next]'));
    click(form.querySelector('[data-step]:not([hidden]) [data-next]'));
    expect(form.querySelector('[data-error-for="first"]').hidden).toBe(false);
    form.querySelector('[name="first"]').value = 'Ann';
    form.querySelector('[name="last"]').value = 'Lee';
    form.querySelector('[name="email"]').value = 'ann@example.com';
    const dedicate = form.querySelector('[name="tributeOn"]');
    dedicate.checked = true;
    change(dedicate);
    expect(form.querySelector('[data-tribute]').hidden).toBe(false);
    form.querySelector('[name="tributeName"]').value = 'Pat';
    click(form.querySelector('[data-step]:not([hidden]) [data-next]'));
    const review = form.querySelectorAll('[data-step]')[2];
    expect(review.hidden).toBe(false);
    expect(review.querySelector('[data-summary]').textContent).toContain('Scholarships');
    expect(review.querySelector('[data-summary]').textContent).toContain('$250 one-time');
    expect(review.querySelector('[data-summary]').textContent).toContain('In honor of Pat');
    submit(form);
    expect(form.hidden).toBe(true);
    expect(confirm.hidden).toBe(false);
    expect(confirm.querySelector('[data-confirm-name]').textContent).toBe('Ann');
    expect(confirm.querySelector('[data-confirm-ref]').textContent).toBe('DEMO-AAAAAA');
    expect(confirm.querySelector('[data-confirm-date]').textContent).toBe('September 12, 2026');
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('gives again from a clean first step with the linked fund', () => {
    click(form.querySelector('[data-step]:not([hidden]) [data-next]'));
    form.querySelector('[name="first"]').value = 'Ann';
    form.querySelector('[name="last"]').value = 'Lee';
    form.querySelector('[name="email"]').value = 'ann@example.com';
    click(form.querySelector('[data-step]:not([hidden]) [data-next]'));
    submit(form);
    click(confirm.querySelector('[data-restart]'));
    expect(form.hidden).toBe(false);
    expect(form.querySelector('[data-step]').hidden).toBe(false);
    expect(form.querySelector('input[name="fund"]:checked').value).toBe('scholarships');
    expect(form.querySelector('[name="first"]').value).toBe('');
  });
});
