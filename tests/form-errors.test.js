import { describe, it, expect, beforeEach } from 'vitest';
import { showErrors, clearErrors } from '../src/js/lib/form-errors.js';

const fixture = `<form>
  <p data-form-status></p>
  <input name="first"><p data-error-for="first" hidden></p>
  <input name="email"><p data-error-for="email" hidden></p>
  <input type="radio" name="size" value="s"><input type="radio" name="size" value="m"><p data-error-for="size" hidden></p>
</form>`;

describe('form errors', () => {
  let form;
  beforeEach(() => {
    document.body.innerHTML = fixture;
    form = document.querySelector('form');
  });

  it('marks every invalid control, fills the slots and focuses the first in DOM order', () => {
    const had = showErrors(form, { email: 'Bad email.', first: 'Need a name.', size: 'Pick one.' });
    expect(had).toBe(true);
    expect(form.querySelector('[name="first"]').getAttribute('aria-invalid')).toBe('true');
    expect([...form.querySelectorAll('[name="size"]')].every((r) => r.getAttribute('aria-invalid') === 'true')).toBe(true);
    const slot = form.querySelector('[data-error-for="email"]');
    expect(slot.hidden).toBe(false);
    expect(slot.textContent).toBe('Bad email.');
    expect(form.querySelector('[data-form-status]').textContent).toBe('Please fix 3 fields to continue.');
    expect(document.activeElement).toBe(form.querySelector('[name="first"]'));
  });

  it('uses the singular for one field', () => {
    showErrors(form, { email: 'Bad email.' });
    expect(form.querySelector('[data-form-status]').textContent).toBe('Please fix 1 field to continue.');
  });

  it('clears previous errors, including when called with none', () => {
    showErrors(form, { first: 'Need a name.' });
    expect(showErrors(form, {})).toBe(false);
    expect(form.querySelector('[aria-invalid]')).toBeNull();
    expect(form.querySelector('[data-error-for="first"]').hidden).toBe(true);
    expect(form.querySelector('[data-form-status]').textContent).toBe('');
    showErrors(form, { first: 'x' });
    clearErrors(form);
    expect(form.querySelector('[aria-invalid]')).toBeNull();
  });
});
