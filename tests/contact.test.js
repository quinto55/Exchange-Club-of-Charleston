import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { loadPage } from './helpers/load-page.js';
import { TOPICS, topicFromQuery, routeText, validateMessage, mountContact } from '../src/js/flows/contact.js';

const change = (el) => el.dispatchEvent(new Event('change', { bubbles: true }));
const click = (el) => el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
const submit = (form) => form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

describe('contact rules', () => {
  it('knows six topics and where each goes', () => {
    expect(TOPICS.map((t) => t.id)).toEqual(['general', 'membership', 'fair', 'donations', 'media', 'board']);
    expect(routeText('membership')).toBe('Goes to the Membership Committee chair (in production).');
    expect(topicFromQuery('?topic=board')).toBe('board');
    expect(topicFromQuery('?topic=nope')).toBe('general');
  });

  it('requires a name, an email and a message', () => {
    expect(validateMessage({ name: '', email: 'x', message: ' ' })).toEqual({
      name: 'Enter your name.',
      email: 'Enter an email address like name@example.com.',
      message: 'Write a short message.',
    });
  });
});

describe('contact flow', () => {
  let form;
  let confirm;
  let fetchSpy;
  beforeEach(() => {
    loadPage('contact.html');
    fetchSpy = vi.spyOn(globalThis, 'fetch');
    form = document.querySelector('[data-flow="contact"]');
    confirm = document.querySelector('[data-confirm="contact"]');
    mountContact(form, { search: '?topic=board', random: () => 0 });
  });
  afterEach(() => fetchSpy.mockRestore());

  it('matches the select options to TOPICS and preselects from the link', () => {
    expect([...form.querySelectorAll('#contact-topic option')].map((o) => o.value)).toEqual(TOPICS.map((t) => t.id));
    expect(form.querySelector('[name="topic"]').value).toBe('board');
    expect(form.querySelector('[data-route]').textContent).toBe('Goes to the Executive Committee (in production).');
  });

  it('updates the routing hint when the topic changes', () => {
    const topic = form.querySelector('[name="topic"]');
    topic.value = 'donations';
    change(topic);
    expect(form.querySelector('[data-route]').textContent).toBe('Goes to the club treasurer (in production).');
  });

  it('validates, then shows a demo confirmation naming the route', () => {
    submit(form);
    expect(document.activeElement).toBe(form.querySelector('[name="name"]'));
    form.querySelector('[name="name"]').value = 'Ann';
    form.querySelector('[name="email"]').value = 'ann@example.com';
    form.querySelector('[name="message"]').value = 'Hello';
    submit(form);
    expect(form.hidden).toBe(true);
    expect(confirm.hidden).toBe(false);
    expect(confirm.querySelector('[data-confirm-topic]').textContent).toBe('The board');
    expect(confirm.querySelector('[data-confirm-route]').textContent).toBe('the Executive Committee');
    expect(confirm.querySelector('[data-confirm-ref]').textContent).toBe('DEMO-AAAAAA');
    click(confirm.querySelector('[data-restart]'));
    expect(form.hidden).toBe(false);
    expect(form.querySelector('[name="topic"]').value).toBe('board');
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
