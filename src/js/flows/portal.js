import { ANNOUNCEMENTS, COMMITTEES, DEMO_MEMBER, ROSTER, SHIFTS } from '../../data/portal-demo.js';
import { readJson, removeKey, writeJson } from '../lib/storage.js';

export const PORTAL_SESSION_KEY = 'ecc.portal';
export const PORTAL_STATE_KEY = 'ecc.portal.state';

export const initialPortalState = () => ({ shifts: [], committees: [...DEMO_MEMBER.committees] });

export const shiftCount = (shift, state) => shift.filled + (state.shifts.includes(shift.id) ? 1 : 0);

export const isFull = (shift, state) => !state.shifts.includes(shift.id) && shift.filled >= shift.capacity;

export function toggleShift(state, shiftId) {
  if (state.shifts.includes(shiftId)) return { ...state, shifts: state.shifts.filter((id) => id !== shiftId) };
  const shift = SHIFTS.find((s) => s.id === shiftId);
  if (!shift || isFull(shift, state)) return state;
  return { ...state, shifts: [...state.shifts, shiftId] };
}

export function toggleCommittee(state, name) {
  const committees = state.committees.includes(name)
    ? state.committees.filter((c) => c !== name)
    : [...state.committees, name];
  return { ...state, committees };
}

/** Figures for the sign-in teaser, derived from the demo data so the two can't drift apart. */
export const portalPeek = (shifts = SHIFTS, roster = ROSTER, member = DEMO_MEMBER) => ({
  openSpots: shifts.reduce((total, shift) => total + Math.max(0, shift.capacity - shift.filled), 0),
  shiftsNeedingHands: shifts.filter((shift) => shift.filled < shift.capacity).length,
  members: roster.length,
  committees: COMMITTEES.length,
  duesPaidThrough: member.duesPaidThrough,
});

export function filterRoster(roster, query) {
  const q = query.trim().toLowerCase();
  return q ? roster.filter((m) => `${m.name} ${m.committee}`.toLowerCase().includes(q)) : roster;
}

const shortDate = (ymd) =>
  new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', weekday: 'short', month: 'short', day: 'numeric' }).format(new Date(`${ymd}T12:00:00Z`));

function shiftItem(shift, state, doc) {
  const li = doc.createElement('li');
  li.className = 'shift';
  const mine = state.shifts.includes(shift.id);
  const full = isFull(shift, state);
  li.innerHTML =
    `<div><p class="shift__title">${shift.title}</p>` +
    `<p class="shift__meta">${shortDate(shift.date)} · ${shift.time} · ${shiftCount(shift, state)} of ${shift.capacity} filled</p></div>` +
    `<button class="btn btn--sm ${mine ? 'btn--secondary' : 'btn--primary'}" type="button" data-shift="${shift.id}"${full ? ' disabled' : ''}>${mine ? 'Withdraw' : full ? 'Full' : 'Sign up'}</button>`;
  return li;
}

const webStore = (name) => {
  try {
    return window[name];
  } catch {
    return null;
  }
};

export function mountPortal(root, { session = webStore('sessionStorage'), storage = webStore('localStorage') } = {}) {
  if (!root) return;
  const doc = root.ownerDocument;
  const $ = (selector) => root.querySelector(selector);
  const gate = $('[data-portal-gate]');
  const dash = $('[data-portal-dash]');
  const filter = $('[data-roster-filter]');
  const saved = readJson(storage, PORTAL_STATE_KEY, null);
  let state = Array.isArray(saved?.shifts) && Array.isArray(saved?.committees) ? saved : initialPortalState();

  const save = () => writeJson(storage, PORTAL_STATE_KEY, state);
  const renderShifts = () => $('[data-shifts]').replaceChildren(...SHIFTS.map((s) => shiftItem(s, state, doc)));
  const renderCommittees = () => {
    $('[data-committees]').innerHTML = COMMITTEES.map(
      (c) => `<li><label class="check"><input type="checkbox" data-committee="${c}"${state.committees.includes(c) ? ' checked' : ''}> <span>${c}</span></label></li>`,
    ).join('');
  };
  const renderRoster = () => {
    const members = filterRoster(ROSTER, filter.value);
    $('[data-roster]').innerHTML = members
      .map((m) => `<li><span class="roster__name">${m.name}</span><span class="roster__meta">${m.committee} · since ${m.since}</span></li>`)
      .join('');
    $('[data-roster-count]').textContent =
      members.length === ROSTER.length ? `${ROSTER.length} members` : `${members.length} of ${ROSTER.length} members`;
  };
  const renderAll = () => {
    renderShifts();
    renderCommittees();
    renderRoster();
  };
  const show = (signedIn) => {
    gate.hidden = signedIn;
    dash.hidden = !signedIn;
  };

  $('[data-announcements]').innerHTML = ANNOUNCEMENTS.map(
    (a) => `<li><time datetime="${a.date}">${a.label}</time><span>${a.text}</span></li>`,
  ).join('');
  const peek = portalPeek();
  const setPeek = (key, value) => {
    const el = $(`[data-peek="${key}"]`);
    if (el) el.textContent = value;
  };
  setPeek('spots', String(peek.openSpots));
  setPeek('shifts', `spots open across ${peek.shiftsNeedingHands} fair shifts`);
  setPeek('members', String(peek.members));
  setPeek('committees', String(peek.committees));
  setPeek('dues', peek.duesPaidThrough);
  renderAll();
  try {
    show(session?.getItem(PORTAL_SESSION_KEY) === 'demo');
  } catch {
    show(false);
  }

  $('[data-portal-enter]').addEventListener('click', () => {
    try {
      session?.setItem(PORTAL_SESSION_KEY, 'demo');
    } catch {
      // Session storage blocked, continue anyway
    }
    show(true);
    $('[data-portal-welcome]').focus();
  });
  $('[data-portal-signout]').addEventListener('click', () => {
    removeKey(session, PORTAL_SESSION_KEY);
    show(false);
    $('[data-portal-enter]').focus();
  });
  $('[data-portal-reset]').addEventListener('click', () => {
    removeKey(storage, PORTAL_STATE_KEY);
    state = initialPortalState();
    filter.value = '';
    renderAll();
  });
  $('[data-shifts]').addEventListener('click', (event) => {
    const button = event.target.closest('[data-shift]');
    if (!button) return;
    const id = button.dataset.shift;
    state = toggleShift(state, id);
    save();
    renderShifts();
    $(`[data-shift="${id}"]`).focus();
  });
  $('[data-committees]').addEventListener('change', (event) => {
    const box = event.target.closest('[data-committee]');
    if (!box) return;
    state = toggleCommittee(state, box.dataset.committee);
    save();
  });
  filter.addEventListener('input', renderRoster);
}
