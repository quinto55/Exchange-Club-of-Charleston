import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { loadPage } from './helpers/load-page.js';
import { INTERESTS, validateContact, validateAbout, mountJoin } from '../src/js/flows/join.js';

const click = (el) => el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
const submit = (form) => form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

describe('application rules', () => {
  it('requires names and email; checks phone only when given', () => {
    expect(validateContact({ first: '', last: '', email: '', phone: '' })).toEqual({
      first: 'Enter your first name.',
      last: 'Enter your last name.',
      email: 'Enter an email address like name@example.com.',
    });
    expect(validateContact({ first: 'A', last: 'B', email: 'a@b.co', phone: '555-0142' })).toEqual({ phone: 'Enter a 10-digit US phone number.' });
    expect(validateContact({ first: 'A', last: 'B', email: 'a@b.co', phone: '(843) 555-0142' })).toEqual({});
  });

  it('requires at least one interest', () => {
    expect(validateAbout({ interests: [] })).toEqual({ interests: 'Choose at least one interest.' });
    expect(validateAbout({ interests: ['fair'] })).toEqual({});
    expect(INTERESTS.map((i) => i.id)).toEqual(['fair', 'youth', 'child-abuse-prevention', 'americanism', 'community']);
  });
});

describe('application flow on the join page', () => {
  let form;
  let confirm;
  let fetchSpy;
  beforeEach(() => {
    loadPage('join.html');
    fetchSpy = vi.spyOn(globalThis, 'fetch');
    form = document.querySelector('[data-flow="join"]');
    confirm = document.querySelector('[data-confirm="join"]');
    mountJoin(form, { random: () => 0 });
  });
  afterEach(() => fetchSpy.mockRestore());

  it('matches the page checkboxes to INTERESTS', () => {
    expect([...form.querySelectorAll('[name="interests"]')].map((c) => c.value)).toEqual(INTERESTS.map((i) => i.id));
  });

  it('treats Enter on step one as Continue', () => {
    submit(form);
    expect(confirm.hidden).toBe(true);
    expect(form.querySelector('[data-error-for="first"]').hidden).toBe(false);
  });

  it('moves through both steps to a demo confirmation', () => {
    form.querySelector('[name="first"]').value = 'Ann';
    form.querySelector('[name="last"]').value = 'Lee';
    form.querySelector('[name="email"]').value = 'ann@example.com';
    click(form.querySelector('[data-next]'));
    expect(form.querySelectorAll('[data-step]')[1].hidden).toBe(false);
    submit(form);
    expect(form.querySelector('[data-error-for="interests"]').textContent).toBe('Choose at least one interest.');
    form.querySelector('[name="interests"][value="fair"]').checked = true;
    submit(form);
    expect(form.hidden).toBe(true);
    expect(confirm.hidden).toBe(false);
    expect(confirm.querySelector('[data-confirm-name]').textContent).toBe('Ann');
    expect(confirm.querySelector('[data-confirm-ref]').textContent).toBe('DEMO-AAAAAA');
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('goes back without losing entries', () => {
    form.querySelector('[name="first"]').value = 'Ann';
    form.querySelector('[name="last"]').value = 'Lee';
    form.querySelector('[name="email"]').value = 'ann@example.com';
    click(form.querySelector('[data-next]'));
    click(form.querySelector('[data-back]'));
    expect(form.querySelectorAll('[data-step]')[0].hidden).toBe(false);
    expect(form.querySelector('[name="first"]').value).toBe('Ann');
  });
});
