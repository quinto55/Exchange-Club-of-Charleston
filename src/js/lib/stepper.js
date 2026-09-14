/**
 * Multi-step form controller. Shows one `[data-step]` at a time inside `root`, marks the
 * matching `[data-stepper] li` with aria-current="step" (earlier ones get .is-done),
 * announces progress in `[data-step-status]` and focuses the step's `[data-step-heading]`.
 */
export function createStepper(root) {
  const steps = [...root.querySelectorAll('[data-step]')];
  const markers = [...root.querySelectorAll('[data-stepper] li')];
  const status = root.querySelector('[data-step-status]');
  let current = 0;

  function go(index, { focus = true } = {}) {
    current = Math.max(0, Math.min(index, steps.length - 1));
    steps.forEach((step, i) => {
      step.hidden = i !== current;
    });
    markers.forEach((marker, i) => {
      if (i === current) marker.setAttribute('aria-current', 'step');
      else marker.removeAttribute('aria-current');
      marker.classList.toggle('is-done', i < current);
    });
    if (status) status.textContent = `Step ${current + 1} of ${steps.length}: ${steps[current].dataset.stepTitle ?? ''}`;
    if (focus) steps[current].querySelector('[data-step-heading]')?.focus();
  }

  go(0, { focus: false });
  return {
    go,
    next: () => go(current + 1),
    back: () => go(current - 1),
    get index() {
      return current;
    },
    get count() {
      return steps.length;
    },
  };
}
