import { CLUB, FAIR } from '../data/club.js';
import { MEETINGS } from '../data/meetings.js';
import { countdownState, countdownText, meetingDateParts, upcomingMeetings } from './lib/dates.js';
import { renderMeetingCards } from './lib/meeting-cards.js';
import { mountCountUp } from './lib/countup.js';

/** Mobile menu: toggle button, Escape to close, close after choosing a link. */
export function initMenu(doc = document) {
  const header = doc.querySelector('[data-site-header]');
  const toggle = doc.querySelector('[data-menu-toggle]');
  if (!header || !toggle) return;
  const setOpen = (open) => {
    toggle.setAttribute('aria-expanded', String(open));
    header.toggleAttribute('data-open', open);
    doc.documentElement.classList.toggle('js-scroll-lock', open);
    if (open) {
      doc.documentElement.style.setProperty('--header-h', `${Math.round(header.getBoundingClientRect().bottom)}px`);
    }
  };
  toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));
  doc.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
      setOpen(false);
      toggle.focus();
    }
  });
  header.querySelectorAll('.site-nav a').forEach((a) => a.addEventListener('click', () => setOpen(false)));
}

export function initHeaderShadow(doc = document, win = window) {
  const header = doc.querySelector('[data-site-header]');
  if (!header) return;
  const update = () => header.toggleAttribute('data-scrolled', win.scrollY > 8);
  update();
  win.addEventListener('scroll', update, { passive: true });
}

export function nextMeetingText(now) {
  const [next] = upcomingMeetings(MEETINGS, now, 1);
  return `Next meeting: ${meetingDateParts(next.date).short} · ${CLUB.meeting.time} · ${CLUB.meeting.venue}`;
}

export function initNextMeeting(doc = document, now = new Date()) {
  doc.querySelectorAll('[data-next-meeting]').forEach((el) => {
    el.textContent = nextMeetingText(now);
  });
}

/** Live fair countdown in every [data-countdown]; returns a function that stops the timer. */
export function initCountdowns(doc = document, clock = () => new Date(), win = window) {
  const els = [...doc.querySelectorAll('[data-countdown]')];
  if (els.length === 0) return () => {};
  const start = new Date(FAIR.start);
  const end = new Date(FAIR.end);
  const tick = () => {
    const text = countdownText(countdownState(clock(), start, end));
    els.forEach((el) => {
      el.textContent = text;
    });
  };
  tick();
  const id = win.setInterval(tick, 1000);
  return () => win.clearInterval(id);
}

/** Re-render static meeting lists so past meetings drop off and the list never empties. */
export function initMeetingLists(doc = document, now = new Date()) {
  doc.querySelectorAll('[data-meeting-list]').forEach((list) => {
    const limit = Number(list.dataset.limit || 3);
    renderMeetingCards(list, upcomingMeetings(MEETINGS, now, limit).slice(0, limit), {
      action: list.dataset.action || 'link',
    });
  });
}

export function init(doc = document) {
  doc.documentElement.classList.replace('no-js', 'js');
  initMenu(doc);
  initHeaderShadow(doc);
  initNextMeeting(doc);
  initCountdowns(doc);
  initMeetingLists(doc);
  mountCountUp(doc.body);
}
