import { meetingDateParts } from './dates.js';
import { CLUB } from '../../data/club.js';

/** One meeting as a place card. Keep static page markup identical to this output. */
export function meetingCardHtml(meeting, { action = 'link' } = {}) {
  const { month, day, long } = meetingDateParts(meeting.date);
  const tag = meeting.tentative
    ? '<span class="place-card__tag place-card__tag--tentative">Tentative</span>'
    : '<span class="place-card__tag">Guests welcome</span>';
  const link =
    action === 'link'
      ? `<a class="btn btn--secondary place-card__action" href="meetings.html#rsvp">Reserve a seat<span class="visually-hidden"> for ${long}</span></a>`
      : '';
  return (
    '<li class="place-card">' +
    `<p class="place-card__date" aria-hidden="true"><span class="place-card__month">${month}</span><span class="place-card__day">${day}</span></p>` +
    '<div class="place-card__body">' +
    `<p class="place-card__title">${meeting.title}</p>` +
    `<p class="place-card__meta"><time datetime="${meeting.date}T12:00">${long}</time> · ${CLUB.meeting.time}</p>` +
    `<p class="place-card__meta">${CLUB.meeting.venue}</p>` +
    `${tag}</div>${link}</li>`
  );
}

export function renderMeetingCards(list, meetings, opts) {
  list.innerHTML = meetings.map((m) => meetingCardHtml(m, opts)).join('');
}
