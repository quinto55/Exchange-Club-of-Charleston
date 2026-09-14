import { isEmail, isFilled } from '../lib/validate.js';
import { demoRef } from '../lib/ref.js';
import { clearErrors, showErrors } from '../lib/form-errors.js';

/** Topics and the role each routes to in production (spec §3 Contact). */
export const TOPICS = [
  { id: 'general', label: 'General question', route: 'the club secretary' },
  { id: 'membership', label: 'Membership', route: 'the Membership Committee chair' },
  { id: 'fair', label: 'The Coastal Carolina Fair', route: 'the fair operations team' },
  { id: 'donations', label: 'Donations', route: 'the club treasurer' },
  { id: 'media', label: 'Media', route: 'the club president' },
  { id: 'board', label: 'The board', route: 'the Executive Committee' },
];

const topic = (id) => TOPICS.find((t) => t.id === id) ?? TOPICS[0];

export function topicFromQuery(search) {
  const id = new URLSearchParams(search).get('topic');
  return TOPICS.some((t) => t.id === id) ? id : 'general';
}

export const routeText = (id) => `Goes to ${topic(id).route} (in production).`;

export function validateMessage({ name, email, message }) {
  const errors = {};
  if (!isFilled(name)) errors.name = 'Enter your name.';
  if (!isEmail(email)) errors.email = 'Enter an email address like name@example.com.';
  if (!isFilled(message)) errors.message = 'Write a short message.';
  return errors;
}

export function mountContact(form, { search = '', random = Math.random } = {}) {
  if (!form) return;
  const confirm = form.ownerDocument.querySelector('[data-confirm="contact"]');
  const field = (name) => form.querySelector(`[name="${name}"]`);
  const route = form.querySelector('[data-route]');
  const syncRoute = () => {
    route.textContent = routeText(field('topic').value);
  };
  const preselect = () => {
    field('topic').value = topicFromQuery(search);
    syncRoute();
  };

  preselect();
  field('topic').addEventListener('change', syncRoute);
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const entry = { name: field('name').value, email: field('email').value, message: field('message').value };
    if (showErrors(form, validateMessage(entry))) return;
    const chosen = topic(field('topic').value);
    confirm.querySelector('[data-confirm-name]').textContent = entry.name.trim();
    confirm.querySelector('[data-confirm-topic]').textContent = chosen.label;
    confirm.querySelector('[data-confirm-route]').textContent = chosen.route;
    confirm.querySelector('[data-confirm-ref]').textContent = demoRef(random);
    form.hidden = true;
    confirm.hidden = false;
    confirm.focus();
  });
  confirm.querySelector('[data-restart]').addEventListener('click', () => {
    form.reset();
    clearErrors(form);
    preselect();
    confirm.hidden = true;
    form.hidden = false;
    field('name').focus();
  });
}
