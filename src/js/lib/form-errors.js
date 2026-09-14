/**
 * Show validation errors. `errors` maps a control name to its message.
 * Returns true when there were any; focuses the first invalid control in DOM order.
 */
export function showErrors(form, errors) {
  clearErrors(form);
  const names = Object.keys(errors);
  for (const name of names) {
    form.querySelectorAll(`[name="${name}"]`).forEach((el) => el.setAttribute('aria-invalid', 'true'));
    const slot = form.querySelector(`[data-error-for="${name}"]`);
    if (slot) {
      slot.textContent = errors[name];
      slot.hidden = false;
    }
  }
  const status = form.querySelector('[data-form-status]');
  if (status && names.length) {
    status.textContent = `Please fix ${names.length} ${names.length === 1 ? 'field' : 'fields'} to continue.`;
  }
  form.querySelector('[aria-invalid="true"]')?.focus();
  return names.length > 0;
}

export function clearErrors(form) {
  form.querySelectorAll('[aria-invalid="true"]').forEach((el) => el.removeAttribute('aria-invalid'));
  form.querySelectorAll('[data-error-for]').forEach((slot) => {
    slot.textContent = '';
    slot.hidden = true;
  });
  const status = form.querySelector('[data-form-status]');
  if (status) status.textContent = '';
}
