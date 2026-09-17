import { CLUB } from '../../data/club.js';
import { MEETINGS } from '../../data/meetings.js';
import { meetingDateParts, upcomingMeetings } from '../lib/dates.js';
import { isEmail, isFilled } from '../lib/validate.js';
import { demoRef } from '../lib/ref.js';
import { buildMeetingsIcs, downloadIcs } from '../lib/ics.js';
import { createStepper } from '../lib/stepper.js';
import { clearErrors, showErrors } from '../lib/form-errors.js';
import { fillSummary } from '../lib/summary.js';

export const RSVP_CHOICES = 5;

export const validateRsvpChoice = ({ meeting }) => (meeting ? {} : { meeting: 'Choose a Thursday.' });

export function validateRsvpDetails({ name, email }) {
  const errors = {};
  if (!isFilled(name)) errors.name = 'Enter your name.';
  if (!isEmail(email)) errors.email = 'Enter an email address like name@example.com.';
  return errors;
}

/* The venue is stated once in the panel beside this form, so the chips carry only
   the date and time rather than repeating it five times. */
function choiceHtml(meeting) {
  const note = meeting.tentative ? ' · Tentative' : '';
  return (
    `<label class="choice"><input type="radio" name="meeting" value="${meeting.date}">` +
    `<span class="choice__label"><strong>${meetingDateParts(meeting.date).short}</strong>` +
    `<span>${CLUB.meeting.time}${note}</span></span></label>`
  );
}

export function rsvpSummary({ meeting, guests, name }) {
  const { long } = meetingDateParts(meeting);
  return {
    title: `You’re on the list for ${long}`,
    rows: [
      ['When', `${long} · ${CLUB.meeting.time}`],
      ['Where', `${CLUB.meeting.venue}, ${CLUB.meeting.address}`],
      ['Guests', guests === 1 ? '1 person' : `${guests} people`],
      ['Name', name.trim()],
    ],
  };
}

export function mountRsvp(form, { now = () => new Date(), random = Math.random, download = downloadIcs } = {}) {
  if (!form) return;
  const doc = form.ownerDocument;
  const confirm = doc.querySelector('[data-confirm="rsvp"]');
  const field = (name) => form.querySelector(`[name="${name}"]`);
  const chosen = () => form.querySelector('input[name="meeting"]:checked')?.value ?? '';
  form.querySelector('[data-rsvp-choices]').innerHTML = upcomingMeetings(MEETINGS, now(), RSVP_CHOICES)
    .slice(0, RSVP_CHOICES)
    .map(choiceHtml)
    .join('');
  const stepper = createStepper(form);
  let booking = null;

  const next = () => {
    if (!showErrors(form, validateRsvpChoice({ meeting: chosen() }))) stepper.next();
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
    const details = { name: field('name').value, email: field('email').value };
    if (showErrors(form, validateRsvpDetails(details))) return;
    booking = { meeting: chosen(), guests: Number(field('guests').value), ...details };
    const { title, rows } = rsvpSummary(booking);
    confirm.querySelector('[data-confirm-title]').textContent = title;
    fillSummary(confirm.querySelector('[data-confirm-summary]'), rows, doc);
    confirm.querySelector('[data-confirm-ref]').textContent = demoRef(random);
    form.hidden = true;
    confirm.hidden = false;
    confirm.focus();
  });
  confirm.querySelector('[data-add-calendar]').addEventListener('click', () => {
    const ics = buildMeetingsIcs([{ date: booking.meeting, title: 'Weekly Club Meeting' }], CLUB.meeting, { now: now() });
    download('exchange-club-meeting.ics', ics, doc);
  });
  confirm.querySelector('[data-restart]').addEventListener('click', () => {
    form.reset();
    clearErrors(form);
    booking = null;
    confirm.hidden = true;
    form.hidden = false;
    stepper.go(0);
  });
}

export function mountSubscribe(button, { now = () => new Date(), download = downloadIcs } = {}) {
  if (!button) return;
  button.addEventListener('click', () => {
    const meetings = upcomingMeetings(MEETINGS, now(), RSVP_CHOICES).slice(0, RSVP_CHOICES);
    download('exchange-club-meetings.ics', buildMeetingsIcs(meetings, CLUB.meeting, { now: now() }), button.ownerDocument);
  });
}
