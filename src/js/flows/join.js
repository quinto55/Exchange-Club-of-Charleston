import { isEmail, isFilled, isUsPhone } from '../lib/validate.js';
import { demoRef } from '../lib/ref.js';
import { createStepper } from '../lib/stepper.js';
import { clearErrors, showErrors } from '../lib/form-errors.js';

export const INTERESTS = [
  { id: 'fair', label: 'Fair operations' },
  { id: 'youth', label: 'Scholarships & youth' },
  { id: 'child-abuse-prevention', label: 'Child abuse prevention' },
  { id: 'patriotism', label: 'Patriotism & military' },
  { id: 'community', label: 'Community service' },
];

export function validateContact({ first, last, email, phone }) {
  const errors = {};
  if (!isFilled(first)) errors.first = 'Enter your first name.';
  if (!isFilled(last)) errors.last = 'Enter your last name.';
  if (!isEmail(email)) errors.email = 'Enter an email address like name@example.com.';
  if (isFilled(phone) && !isUsPhone(phone)) errors.phone = 'Enter a 10-digit US phone number.';
  return errors;
}

export const validateAbout = ({ interests }) => (interests.length ? {} : { interests: 'Choose at least one interest.' });

export function mountJoin(form, { random = Math.random } = {}) {
  if (!form) return;
  const confirm = form.ownerDocument.querySelector('[data-confirm="join"]');
  const text = (name) => form.querySelector(`[name="${name}"]`).value;
  const stepper = createStepper(form);
  const contact = () => ({ first: text('first'), last: text('last'), email: text('email'), phone: text('phone') });
  const interests = () => [...form.querySelectorAll('[name="interests"]:checked')].map((box) => box.value);

  const next = () => {
    if (!showErrors(form, validateContact(contact()))) stepper.next();
  };
  form.querySelector('[data-next]').addEventListener('click', next);
  form.querySelector('[data-back]').addEventListener('click', () => {
    clearErrors(form);
    stepper.back();
  });
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (stepper.index < stepper.count - 1) {
      next();
      return;
    }
    if (showErrors(form, validateAbout({ interests: interests() }))) return;
    confirm.querySelector('[data-confirm-name]').textContent = text('first').trim();
    confirm.querySelector('[data-confirm-ref]').textContent = demoRef(random);
    form.hidden = true;
    confirm.hidden = false;
    confirm.focus();
  });
}
