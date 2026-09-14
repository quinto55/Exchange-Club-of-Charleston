import { it, expect } from 'vitest';
import { fillSummary } from '../src/js/lib/summary.js';

it('writes dt/dd rows as text, never as markup', () => {
  const dl = document.createElement('dl');
  dl.innerHTML = '<div><dt>old</dt><dd>row</dd></div>';
  fillSummary(dl, [['Name', '<b>Sam</b>'], ['Guests', '2 people']]);
  expect(dl.querySelectorAll('div')).toHaveLength(2);
  expect(dl.querySelector('dd').textContent).toBe('<b>Sam</b>');
  expect(dl.querySelector('b')).toBeNull();
  expect(dl.querySelectorAll('dt')[1].textContent).toBe('Guests');
});
