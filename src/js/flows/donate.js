import { FUNDS } from '../../data/funds.js';
import { formatUSD, isEmail, isFilled, isValidAmount, parseAmount } from '../lib/validate.js';
import { demoRef } from '../lib/ref.js';
import { easternYmd } from '../lib/dates.js';
import { createStepper } from '../lib/stepper.js';
import { clearErrors, showErrors } from '../lib/form-errors.js';
import { fillSummary } from '../lib/summary.js';

const fundName = (id) => FUNDS.find((f) => f.id === id)?.name ?? '';

export function fundFromQuery(search) {
  const id = new URLSearchParams(search).get('fund');
  return FUNDS.some((f) => f.id === id) ? id : 'general';
}

export const giftAmount = (state) => (state.amount === 'custom' ? parseAmount(state.custom) : state.amount);

export function validateGift(state) {
  return isValidAmount(giftAmount(state)) ? {} : { custom: 'Enter a whole-dollar amount between $5 and $100,000.' };
}

export function validateDetails(state) {
  const errors = {};
  if (!isFilled(state.first)) errors.first = 'Enter your first name.';
  if (!isFilled(state.last)) errors.last = 'Enter your last name.';
  if (!isEmail(state.email)) errors.email = 'Enter an email address like name@example.com.';
  if (state.tributeOn && !isFilled(state.tributeName)) errors.tributeName = 'Enter the name of the person you’re honoring.';
  return errors;
}

export function donationSummary(state) {
  const amount = giftAmount(state);
  return {
    fund: fundName(state.fund),
    line: state.frequency === 'monthly' ? `${formatUSD(amount)} per month (${formatUSD(amount * 12)} per year)` : `${formatUSD(amount)} one-time`,
    tribute: state.tributeOn ? `In ${state.tributeType === 'memory' ? 'memory' : 'honor'} of ${state.tributeName.trim()}` : null,
  };
}

const summaryRows = ({ fund, line, tribute }) => [['Fund', fund], ['Gift', line], ...(tribute ? [['Dedication', tribute]] : [])];

const longDate = (date) =>
  new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', month: 'long', day: 'numeric', year: 'numeric' }).format(date);

export function mountDonate(form, { search = '', now = () => new Date(), random = Math.random } = {}) {
  if (!form) return;
  const doc = form.ownerDocument;
  const confirm = doc.querySelector('[data-confirm="donate"]');
  // form.elements (a live RadioNodeList) rather than a `:checked` querySelector: happy-dom
  // caches querySelector matches and doesn't invalidate the cache when `.checked` is set as a
  // property (only on attribute/structural mutation), so a repeated `:checked` query can return
  // a stale radio after a later selection changes.
  const radio = (name) => form.elements[name]?.value ?? '';
  const text = (name) => form.querySelector(`[name="${name}"]`).value;
  const tributeToggle = form.querySelector('[name="tributeOn"]');
  const stepper = createStepper(form);

  const read = () => ({
    fund: radio('fund'),
    amount: radio('amount') === 'custom' ? 'custom' : Number(radio('amount')),
    custom: text('custom'),
    frequency: radio('frequency'),
    tributeOn: tributeToggle.checked,
    tributeType: radio('tributeType'),
    tributeName: text('tributeName'),
    first: text('first'),
    last: text('last'),
    email: text('email'),
  });
  const sync = () => {
    form.querySelector('[data-custom-field]').hidden = radio('amount') !== 'custom';
    form.querySelector('[data-tribute]').hidden = !tributeToggle.checked;
  };
  const preselect = () => {
    form.querySelector(`input[name="fund"][value="${fundFromQuery(search)}"]`).checked = true;
    sync();
  };
  const next = () => {
    const state = read();
    const errors = stepper.index === 0 ? validateGift(state) : validateDetails(state);
    if (showErrors(form, errors)) return;
    if (stepper.index === 1) fillSummary(form.querySelector('[data-summary]'), summaryRows(donationSummary(state)), doc);
    stepper.next();
  };

  preselect();
  form.addEventListener('change', sync);
  form.querySelectorAll('[data-next]').forEach((button) => button.addEventListener('click', next));
  form.querySelectorAll('[data-back]').forEach((button) =>
    button.addEventListener('click', () => {
      clearErrors(form);
      stepper.back();
    }),
  );
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (stepper.index < stepper.count - 1) {
      next();
      return;
    }
    const state = read();
    const today = now();
    confirm.querySelector('[data-confirm-name]').textContent = state.first.trim();
    fillSummary(confirm.querySelector('[data-confirm-summary]'), summaryRows(donationSummary(state)), doc);
    confirm.querySelector('[data-confirm-ref]').textContent = demoRef(random);
    const date = confirm.querySelector('[data-confirm-date]');
    date.textContent = longDate(today);
    date.setAttribute('datetime', easternYmd(today));
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
    stepper.go(0);
  });
}
