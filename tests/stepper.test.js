import { describe, it, expect, beforeEach } from 'vitest';
import { createStepper } from '../src/js/lib/stepper.js';

const fixture = `<form>
  <ol data-stepper><li>A</li><li>B</li><li>C</li></ol>
  <p data-step-status></p>
  <fieldset data-step data-step-title="One"><legend tabindex="-1" data-step-heading>One</legend></fieldset>
  <fieldset data-step data-step-title="Two" hidden><legend tabindex="-1" data-step-heading>Two</legend></fieldset>
  <fieldset data-step data-step-title="Three" hidden><legend tabindex="-1" data-step-heading>Three</legend></fieldset>
</form>`;

describe('createStepper', () => {
  let form;
  let steps;
  let markers;
  beforeEach(() => {
    document.body.innerHTML = fixture;
    form = document.querySelector('form');
    steps = [...form.querySelectorAll('[data-step]')];
    markers = [...form.querySelectorAll('[data-stepper] li')];
  });

  it('starts on the first step without moving focus', () => {
    const stepper = createStepper(form);
    expect(stepper.index).toBe(0);
    expect(stepper.count).toBe(3);
    expect(steps.map((s) => s.hidden)).toEqual([false, true, true]);
    expect(markers[0].getAttribute('aria-current')).toBe('step');
    expect(form.querySelector('[data-step-status]').textContent).toBe('Step 1 of 3: One');
    expect(document.activeElement).toBe(document.body);
  });

  it('moves forward and back, marking finished steps and focusing the heading', () => {
    const stepper = createStepper(form);
    stepper.next();
    expect(steps.map((s) => s.hidden)).toEqual([true, false, true]);
    expect(markers[0].classList.contains('is-done')).toBe(true);
    expect(markers[0].hasAttribute('aria-current')).toBe(false);
    expect(markers[1].getAttribute('aria-current')).toBe('step');
    expect(document.activeElement.textContent).toBe('Two');
    stepper.back();
    expect(stepper.index).toBe(0);
    expect(markers[0].classList.contains('is-done')).toBe(false);
  });

  it('clamps out-of-range steps', () => {
    const stepper = createStepper(form);
    stepper.go(9);
    expect(stepper.index).toBe(2);
    stepper.go(-4);
    expect(stepper.index).toBe(0);
  });
});
