# Part 3 — Demo flows

Plan index: `../2026-09-11-exchange-club-demo.md` (read its **Global Constraints** and **Shared conventions** first).

All flows share three rules: (1) no `fetch`/XHR/`sendBeacon` — tests spy on `fetch` and assert it is never called; (2) the confirmation is labeled *Demo* and carries a `demoRef()` reference; (3) user-typed text is only ever written with `textContent` (never `innerHTML`). Multi-step forms treat a native submit (Enter key) on an earlier step as "Continue", so validation can never be skipped. Every flow page keeps working without JavaScript by showing a `demo-note no-js-only` message and hiding the form (`js-only`).

---

### Task 10: Meetings page, RSVP flow, and the shared flow libraries

**Files:**
- Create: `src/js/lib/stepper.js`, `src/js/lib/form-errors.js`, `src/js/lib/summary.js`, `src/js/flows/rsvp.js`, `src/js/pages/meetings.js`
- Modify: `src/styles/flows.css` (replace the placeholder comment), `meetings.html` (sections after the page-hero)
- Test: `tests/stepper.test.js`, `tests/form-errors.test.js`, `tests/summary.test.js`, `tests/rsvp.test.js`

**Interfaces:**
- Consumes: `CLUB`, `MEETINGS`, `upcomingMeetings`, `meetingDateParts` (Task 2), `isFilled`, `isEmail`, `demoRef`, `buildMeetingsIcs`, `downloadIcs` (Task 2), `meetingCardHtml` (Task 4), `loadPage` (Task 4).
- Produces (Tasks 11–13 import these):
  - `createStepper(root) → { go(i, { focus }), next(), back(), index, count }` — shows one `[data-step]` at a time; marks `[data-stepper] li` with `aria-current="step"` and `.is-done`; writes `Step N of M: <data-step-title>` into `[data-step-status]`; focuses the step's `[data-step-heading]` (not on the initial render).
  - `showErrors(form, errors) → boolean` and `clearErrors(form)` — `errors` maps a field `name` to a message; sets `aria-invalid="true"` on every control with that name, fills and unhides `[data-error-for="name"]`, writes `Please fix N field(s) to continue.` into `[data-form-status]`, focuses the first invalid control in DOM order.
  - `fillSummary(dl, rows, doc = document)` — replaces a `<dl>`'s children with `<div><dt>term</dt><dd>value</dd></div>` rows using `textContent`.
  - CSS classes in `flows.css`: `flow`, `stepper`, `field`, `field-row`, `field__hint`, `field__error`, `choice-grid`, `choice-grid--compact`, `choice`, `choice__label`, `check`, `nested`, `flow__actions`, `flow__status`, `summary`, `payment-placeholder`, `confirm`, `confirm__badge`, `confirm__ref`, `btn--sm`.
  - Flow markup contract: `form.flow[data-flow="<name>"][novalidate]` + a sibling `div.confirm[data-confirm="<name>"][hidden][tabindex="-1"]`.

- [ ] **Step 1: Write the failing library tests**

`tests/stepper.test.js`:

```js
import { describe, it, expect, beforeEach } from 'vitest';
import { createStepper } from '../src/js/lib/stepper.js';

const fixture = `<form>
  <ol data-stepper><li>A</li><li>B</li><li>C</li></ol>
  <p data-step-status></p>
  <fieldset data-step data-step-title="One"><legend tabindex="-1" data-step-heading>One</legend></fieldset>
  <fieldset data-step data-step-title="Two" hidden><legend tabindex="-1" data-step-heading>Two</legend></fieldset>
  <fieldset data-step data-step-title="Three" hidden><legend tabindex="-1" data-step-heading>Three</legend></fieldset>
</form>`;

describe('createStepper', () => {
  let form;
  let steps;
  let markers;
  beforeEach(() => {
    document.body.innerHTML = fixture;
    form = document.querySelector('form');
    steps = [...form.querySelectorAll('[data-step]')];
    markers = [...form.querySelectorAll('[data-stepper] li')];
  });

  it('starts on the first step without moving focus', () => {
    const stepper = createStepper(form);
    expect(stepper.index).toBe(0);
    expect(stepper.count).toBe(3);
    expect(steps.map((s) => s.hidden)).toEqual([false, true, true]);
    expect(markers[0].getAttribute('aria-current')).toBe('step');
    expect(form.querySelector('[data-step-status]').textContent).toBe('Step 1 of 3: One');
    expect(document.activeElement).toBe(document.body);
  });

  it('moves forward and back, marking finished steps and focusing the heading', () => {
    const stepper = createStepper(form);
    stepper.next();
    expect(steps.map((s) => s.hidden)).toEqual([true, false, true]);
    expect(markers[0].classList.contains('is-done')).toBe(true);
    expect(markers[0].hasAttribute('aria-current')).toBe(false);
    expect(markers[1].getAttribute('aria-current')).toBe('step');
    expect(document.activeElement.textContent).toBe('Two');
    stepper.back();
    expect(stepper.index).toBe(0);
    expect(markers[0].classList.contains('is-done')).toBe(false);
  });

  it('clamps out-of-range steps', () => {
    const stepper = createStepper(form);
    stepper.go(9);
    expect(stepper.index).toBe(2);
    stepper.go(-4);
    expect(stepper.index).toBe(0);
  });
});
```

`tests/form-errors.test.js`:

```js
import { describe, it, expect, beforeEach } from 'vitest';
import { showErrors, clearErrors } from '../src/js/lib/form-errors.js';

const fixture = `<form>
  <p data-form-status></p>
  <input name="first"><p data-error-for="first" hidden></p>
  <input name="email"><p data-error-for="email" hidden></p>
  <input type="radio" name="size" value="s"><input type="radio" name="size" value="m"><p data-error-for="size" hidden></p>
</form>`;

describe('form errors', () => {
  let form;
  beforeEach(() => {
    document.body.innerHTML = fixture;
    form = document.querySelector('form');
  });

  it('marks every invalid control, fills the slots and focuses the first in DOM order', () => {
    const had = showErrors(form, { email: 'Bad email.', first: 'Need a name.', size: 'Pick one.' });
    expect(had).toBe(true);
    expect(form.querySelector('[name="first"]').getAttribute('aria-invalid')).toBe('true');
    expect([...form.querySelectorAll('[name="size"]')].every((r) => r.getAttribute('aria-invalid') === 'true')).toBe(true);
    const slot = form.querySelector('[data-error-for="email"]');
    expect(slot.hidden).toBe(false);
    expect(slot.textContent).toBe('Bad email.');
    expect(form.querySelector('[data-form-status]').textContent).toBe('Please fix 3 fields to continue.');
    expect(document.activeElement).toBe(form.querySelector('[name="first"]'));
  });

  it('uses the singular for one field', () => {
    showErrors(form, { email: 'Bad email.' });
    expect(form.querySelector('[data-form-status]').textContent).toBe('Please fix 1 field to continue.');
  });

  it('clears previous errors, including when called with none', () => {
    showErrors(form, { first: 'Need a name.' });
    expect(showErrors(form, {})).toBe(false);
    expect(form.querySelector('[aria-invalid]')).toBeNull();
    expect(form.querySelector('[data-error-for="first"]').hidden).toBe(true);
    expect(form.querySelector('[data-form-status]').textContent).toBe('');
    showErrors(form, { first: 'x' });
    clearErrors(form);
    expect(form.querySelector('[aria-invalid]')).toBeNull();
  });
});
```

`tests/summary.test.js`:

```js
import { it, expect } from 'vitest';
import { fillSummary } from '../src/js/lib/summary.js';

it('writes dt/dd rows as text, never as markup', () => {
  const dl = document.createElement('dl');
  dl.innerHTML = '<div><dt>old</dt><dd>row</dd></div>';
  fillSummary(dl, [['Name', '<b>Sam</b>'], ['Guests', '2 people']]);
  expect(dl.querySelectorAll('div')).toHaveLength(2);
  expect(dl.querySelector('dd').textContent).toBe('<b>Sam</b>');
  expect(dl.querySelector('b')).toBeNull();
  expect(dl.querySelectorAll('dt')[1].textContent).toBe('Guests');
});
```

- [ ] **Step 2: Run them to verify they fail**

Run: `npx vitest run tests/stepper.test.js tests/form-errors.test.js tests/summary.test.js`
Expected: FAIL — modules not found.

- [ ] **Step 3: Implement the libraries**

`src/js/lib/stepper.js`:

```js
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
```

`src/js/lib/form-errors.js`:

```js
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
```

`src/js/lib/summary.js`:

```js
/** Replace a <dl>'s rows with [term, value] pairs, written as text. */
export function fillSummary(dl, rows, doc = document) {
  dl.replaceChildren(
    ...rows.map(([term, value]) => {
      const row = doc.createElement('div');
      const dt = doc.createElement('dt');
      const dd = doc.createElement('dd');
      dt.textContent = term;
      dd.textContent = value;
      row.append(dt, dd);
      return row;
    }),
  );
}
```

- [ ] **Step 4: Run the library tests to verify they pass**

Run: `npx vitest run tests/stepper.test.js tests/form-errors.test.js tests/summary.test.js`
Expected: PASS (3 + 3 + 1).

- [ ] **Step 5: Replace `src/styles/flows.css`**

```css
/* ---------- Demo flows ---------- */
.flow {
  display: grid; gap: var(--space-5); max-width: 46rem;
  padding: clamp(var(--space-5), 4vw, var(--space-6));
  background: var(--paper); border: 1px solid var(--rule); border-radius: var(--radius-lg); box-shadow: var(--shadow-1);
}
.flow fieldset { display: grid; gap: var(--space-4); min-width: 0; margin: 0; padding: 0; border: 0; }
.flow legend { margin-bottom: var(--space-2); padding: 0; color: var(--navy); font: 700 var(--step-1) / 1.25 var(--font-serif); }
.flow legend:focus { outline: none; }
.flow .nested legend { font: 700 1rem / 1.3 var(--font-sans); color: var(--ink); }
.stepper { display: flex; flex-wrap: wrap; gap: var(--space-2) var(--space-5); margin: 0; padding: 0; list-style: none; counter-reset: step; color: var(--muted); font-size: var(--step--1); }
.stepper li { display: flex; align-items: center; gap: var(--space-2); counter-increment: step; }
.stepper li::before {
  content: counter(step); display: grid; place-items: center; width: 1.7rem; height: 1.7rem;
  border: 2px solid var(--rule); border-radius: 50%; color: var(--muted); font-weight: 700; font-variant-numeric: tabular-nums;
}
.stepper li[aria-current='step'] { color: var(--navy); font-weight: 700; }
.stepper li[aria-current='step']::before { background: var(--navy); border-color: var(--navy); color: var(--paper); }
.stepper li.is-done::before { content: '✓'; border-color: var(--success); color: var(--success); }
.field { display: grid; gap: var(--space-1); }
.field label { color: var(--ink); font-weight: 600; }
.field__hint { color: var(--muted); font-size: var(--step--1); }
.field input, .field select, .field textarea {
  width: 100%; min-height: 44px; padding: 0.6rem 0.75rem;
  background: var(--paper); color: var(--ink); border: 1px solid var(--muted); border-radius: var(--radius); font: inherit;
}
.field textarea { min-height: 8rem; resize: vertical; }
.field input:focus-visible, .field select:focus-visible, .field textarea:focus-visible { outline: 3px solid var(--navy); outline-offset: 1px; border-color: var(--navy); }
.field [aria-invalid='true'] { border: 2px solid var(--danger); }
.field__error { color: var(--danger); font-size: var(--step--1); font-weight: 600; }
.field-row { display: grid; gap: var(--space-4); }
@media (min-width: 600px) { .field-row { grid-template-columns: 1fr 1fr; } }
.choice-grid { display: grid; gap: var(--space-3); grid-template-columns: repeat(auto-fill, minmax(min(100%, 12rem), 1fr)); }
.choice-grid--compact { grid-template-columns: repeat(auto-fill, minmax(min(100%, 7rem), 1fr)); }
.choice { position: relative; display: grid; }
.choice input { position: absolute; inset: 0; opacity: 0; margin: 0; cursor: pointer; }
.choice__label {
  display: grid; align-content: start; gap: 0.2rem; padding: var(--space-4);
  background: var(--paper); border: 2px solid var(--rule); border-radius: var(--radius); cursor: pointer;
  transition: border-color 0.15s, background-color 0.15s;
}
.choice__label strong { color: var(--navy); }
.choice__label span { color: var(--muted); font-size: var(--step--1); }
.choice-grid--compact .choice__label { place-items: center; color: var(--navy); font: 700 1.1rem / 1 var(--font-sans); font-variant-numeric: tabular-nums; }
.choice input:checked + .choice__label { background: var(--navy-tint); border-color: var(--navy); }
.choice input:focus-visible + .choice__label { outline: 3px solid var(--navy); outline-offset: 2px; }
.choice input[aria-invalid='true'] + .choice__label { border-color: var(--danger); }
.check { display: flex; align-items: flex-start; gap: var(--space-2); font-weight: 600; }
.check input { width: 1.2rem; height: 1.2rem; margin-top: 0.2rem; accent-color: var(--navy); }
.flow__actions { display: flex; flex-wrap: wrap; justify-content: flex-end; align-items: center; gap: var(--space-3); padding-top: var(--space-4); border-top: 1px solid var(--rule); }
.flow__actions [data-back] { margin-right: auto; }
.flow__status { color: var(--danger); font-size: var(--step--1); font-weight: 600; }
.flow__status:empty { display: none; }
.summary { display: grid; margin: 0; border: 1px solid var(--rule); border-radius: var(--radius); }
.summary div { display: grid; grid-template-columns: minmax(6rem, 9rem) 1fr; gap: var(--space-3); padding: var(--space-3) var(--space-4); border-top: 1px solid var(--rule); }
.summary div:first-child { border-top: 0; }
.summary dt { color: var(--muted); font-weight: 600; }
.summary dd { margin: 0; font-variant-numeric: tabular-nums; }
.payment-placeholder { display: grid; gap: var(--space-2); padding: var(--space-5); border: 2px dashed var(--rule); border-radius: var(--radius); color: var(--muted); text-align: center; }
.payment-placeholder strong { color: var(--navy); }
.confirm {
  display: grid; gap: var(--space-4); max-width: 46rem; padding: clamp(var(--space-5), 4vw, var(--space-6));
  background: var(--paper); border: 1px solid var(--rule); border-top: 6px solid var(--success); border-radius: var(--radius-lg); box-shadow: var(--shadow-1);
}
.confirm:focus { outline: none; }
.confirm__badge {
  justify-self: start; padding: 0.2rem 0.75rem; border-radius: 999px;
  background: color-mix(in srgb, var(--success) 12%, var(--paper)); color: var(--success); font-size: var(--step--1); font-weight: 700;
}
.confirm__ref { font-weight: 700; letter-spacing: 0.08em; font-variant-numeric: tabular-nums; }
.btn--sm { min-height: 40px; padding: 0.5rem 0.9rem; font-size: 0.95rem; }
.btn:disabled { cursor: not-allowed; opacity: 0.55; }
```

- [ ] **Step 6: Add the meetings sections** to `meetings.html`, after the page-hero `</header>` inside `<main>`, and add `<script type="module" src="/src/js/pages/meetings.js"></script>` before `</body>`:

```html
  <section class="section" aria-labelledby="when-title">
    <div class="container split">
      <div class="prose">
        <p class="eyebrow">Every Thursday</p>
        <h2 id="when-title">Thursdays at 12:00 PM</h2>
        <p><strong>Charleston Rifle Club</strong><br>2221 Heriot St, Charleston, SC 29403<br><a href="https://maps.google.com/?q=32.814137,-79.957306" rel="noopener">Open in Google Maps</a></p>
        <h3>What to expect as a guest</h3>
        <ul>
          <li>Lunch with members at the Charleston Rifle Club.</li>
          <li>A guest speaker on a topic that matters to our members and our city.</li>
          <li>Guests are welcome at any meeting marked “Guests welcome.”</li>
        </ul>
      </div>
      <figure class="photo">
        <img src="/src/assets/img/meetings-lunch-960.webp" srcset="/src/assets/img/meetings-lunch-480.webp 480w, /src/assets/img/meetings-lunch-960.webp 960w, /src/assets/img/meetings-lunch-1600.webp 1600w" sizes="(min-width: 900px) 50vw, 100vw" width="1600" height="1067" loading="lazy" decoding="async" alt="Members at a Thursday lunch meeting">
      </figure>
    </div>
  </section>

  <section class="section section--tint" id="upcoming" aria-labelledby="upcoming-title">
    <div class="container">
      <div class="section-head">
        <p class="eyebrow">Calendar</p>
        <h2 id="upcoming-title">Upcoming meetings</h2>
      </div>
      <ul class="place-list" data-meeting-list data-limit="5">
        <li class="place-card"><p class="place-card__date" aria-hidden="true"><span class="place-card__month">SEP</span><span class="place-card__day">17</span></p><div class="place-card__body"><p class="place-card__title">Weekly Club Meeting</p><p class="place-card__meta"><time datetime="2026-09-17T12:00">Thursday, September 17, 2026</time> · 12:00 PM</p><p class="place-card__meta">Charleston Rifle Club</p><span class="place-card__tag">Guests welcome</span></div><a class="btn btn--secondary place-card__action" href="meetings.html#rsvp">Reserve a seat<span class="visually-hidden"> for Thursday, September 17, 2026</span></a></li>
        <li class="place-card"><p class="place-card__date" aria-hidden="true"><span class="place-card__month">OCT</span><span class="place-card__day">1</span></p><div class="place-card__body"><p class="place-card__title">Weekly Club Meeting</p><p class="place-card__meta"><time datetime="2026-10-01T12:00">Thursday, October 1, 2026</time> · 12:00 PM</p><p class="place-card__meta">Charleston Rifle Club</p><span class="place-card__tag">Guests welcome</span></div><a class="btn btn--secondary place-card__action" href="meetings.html#rsvp">Reserve a seat<span class="visually-hidden"> for Thursday, October 1, 2026</span></a></li>
        <li class="place-card"><p class="place-card__date" aria-hidden="true"><span class="place-card__month">OCT</span><span class="place-card__day">8</span></p><div class="place-card__body"><p class="place-card__title">Weekly Club Meeting</p><p class="place-card__meta"><time datetime="2026-10-08T12:00">Thursday, October 8, 2026</time> · 12:00 PM</p><p class="place-card__meta">Charleston Rifle Club</p><span class="place-card__tag">Guests welcome</span></div><a class="btn btn--secondary place-card__action" href="meetings.html#rsvp">Reserve a seat<span class="visually-hidden"> for Thursday, October 8, 2026</span></a></li>
        <li class="place-card"><p class="place-card__date" aria-hidden="true"><span class="place-card__month">OCT</span><span class="place-card__day">15</span></p><div class="place-card__body"><p class="place-card__title">Weekly Club Meeting</p><p class="place-card__meta"><time datetime="2026-10-15T12:00">Thursday, October 15, 2026</time> · 12:00 PM</p><p class="place-card__meta">Charleston Rifle Club</p><span class="place-card__tag">Guests welcome</span></div><a class="btn btn--secondary place-card__action" href="meetings.html#rsvp">Reserve a seat<span class="visually-hidden"> for Thursday, October 15, 2026</span></a></li>
        <li class="place-card"><p class="place-card__date" aria-hidden="true"><span class="place-card__month">NOV</span><span class="place-card__day">5</span></p><div class="place-card__body"><p class="place-card__title">Weekly Club Meeting</p><p class="place-card__meta"><time datetime="2026-11-05T12:00">Thursday, November 5, 2026</time> · 12:00 PM</p><p class="place-card__meta">Charleston Rifle Club</p><span class="place-card__tag">Guests welcome</span></div><a class="btn btn--secondary place-card__action" href="meetings.html#rsvp">Reserve a seat<span class="visually-hidden"> for Thursday, November 5, 2026</span></a></li>
      </ul>
      <p>The club calendar also lists the <a href="fair.html">Coastal Carolina Fair</a>, October 29 – November 8, 2026.</p>
      <div class="btn-row js-only"><button class="btn btn--secondary" type="button" data-subscribe>Add these meetings to my calendar</button></div>
    </div>
  </section>

  <section class="section" id="rsvp" aria-labelledby="rsvp-title">
    <div class="container">
      <div class="section-head">
        <p class="eyebrow">Reserve a seat</p>
        <h2 id="rsvp-title">Come as our guest</h2>
        <p class="lede">Pick a Thursday and tell us who’s coming.</p>
      </div>
      <p class="demo-note no-js-only">The RSVP form needs JavaScript in this demo.</p>
      <form class="flow js-only" data-flow="rsvp" novalidate>
        <p class="demo-note">Nothing is sent — this RSVP stays in your browser.</p>
        <ol class="stepper" data-stepper aria-label="RSVP progress"><li>Choose a date</li><li>Your details</li></ol>
        <p class="visually-hidden" data-step-status aria-live="polite"></p>
        <p class="flow__status" data-form-status aria-live="polite"></p>
        <fieldset data-step data-step-title="Choose a date">
          <legend tabindex="-1" data-step-heading>Which Thursday?</legend>
          <div class="choice-grid" data-rsvp-choices></div>
          <p class="field__error" data-error-for="meeting" hidden></p>
          <div class="field">
            <label for="rsvp-guests">How many are coming?</label>
            <select id="rsvp-guests" name="guests"><option value="1">1</option><option value="2">2</option><option value="3">3</option><option value="4">4</option></select>
          </div>
          <div class="flow__actions"><button class="btn btn--primary" type="button" data-next>Continue</button></div>
        </fieldset>
        <fieldset data-step data-step-title="Your details" hidden>
          <legend tabindex="-1" data-step-heading>Who should we expect?</legend>
          <div class="field-row">
            <div class="field">
              <label for="rsvp-name">Your name</label>
              <input id="rsvp-name" name="name" autocomplete="name" aria-describedby="err-rsvp-name">
              <p class="field__error" id="err-rsvp-name" data-error-for="name" hidden></p>
            </div>
            <div class="field">
              <label for="rsvp-email">Email</label>
              <input id="rsvp-email" name="email" type="email" autocomplete="email" aria-describedby="err-rsvp-email">
              <p class="field__error" id="err-rsvp-email" data-error-for="email" hidden></p>
            </div>
          </div>
          <div class="flow__actions">
            <button class="btn btn--secondary" type="button" data-back>Back</button>
            <button class="btn btn--primary" type="submit">Reserve my seat</button>
          </div>
        </fieldset>
      </form>
      <div class="confirm" data-confirm="rsvp" hidden tabindex="-1">
        <p class="confirm__badge">Demo confirmation</p>
        <h3 data-confirm-title>You’re on the list</h3>
        <dl class="summary" data-confirm-summary></dl>
        <p>Reference <span class="confirm__ref" data-confirm-ref></span></p>
        <div class="btn-row">
          <button class="btn btn--primary" type="button" data-add-calendar>Add to my calendar</button>
          <button class="btn btn--secondary" type="button" data-restart>Reserve another seat</button>
        </div>
        <p class="demo-note">In production this would email you a confirmation and tell the Meeting Administration committee. Here, nothing left your browser.</p>
      </div>
    </div>
  </section>
```

- [ ] **Step 7: Write the failing flow test `tests/rsvp.test.js`**

```js
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { loadPage } from './helpers/load-page.js';
import { validateRsvpChoice, validateRsvpDetails, rsvpSummary, mountRsvp, mountSubscribe } from '../src/js/flows/rsvp.js';

const click = (el) => el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
const submit = (form) => form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
const now = () => new Date('2026-09-11T12:00:00-04:00');

describe('rsvp rules', () => {
  it('requires a meeting, a name and a valid email', () => {
    expect(validateRsvpChoice({ meeting: '' })).toEqual({ meeting: 'Choose a Thursday.' });
    expect(validateRsvpChoice({ meeting: '2026-10-01' })).toEqual({});
    expect(validateRsvpDetails({ name: ' ', email: 'x' })).toEqual({
      name: 'Enter your name.',
      email: 'Enter an email address like name@example.com.',
    });
    expect(validateRsvpDetails({ name: 'Sam', email: 'sam@example.com' })).toEqual({});
  });

  it('summarizes the booking', () => {
    expect(rsvpSummary({ meeting: '2026-10-01', guests: 2, name: ' Sam Lee ' })).toEqual({
      title: 'You’re on the list for Thursday, October 1, 2026',
      rows: [
        ['When', 'Thursday, October 1, 2026 · 12:00 PM'],
        ['Where', 'Charleston Rifle Club, 2221 Heriot St, Charleston, SC 29403'],
        ['Guests', '2 people'],
        ['Name', 'Sam Lee'],
      ],
    });
    expect(rsvpSummary({ meeting: '2026-10-01', guests: 1, name: 'A' }).rows[2]).toEqual(['Guests', '1 person']);
  });
});

describe('rsvp flow on the meetings page', () => {
  let form;
  let confirm;
  let download;
  let fetchSpy;
  beforeEach(() => {
    loadPage('meetings.html');
    fetchSpy = vi.spyOn(globalThis, 'fetch');
    download = vi.fn();
    form = document.querySelector('[data-flow="rsvp"]');
    confirm = document.querySelector('[data-confirm="rsvp"]');
    mountRsvp(form, { now, random: () => 0, download });
  });
  afterEach(() => fetchSpy.mockRestore());

  it('offers the next five Thursdays', () => {
    const values = [...form.querySelectorAll('input[name="meeting"]')].map((r) => r.value);
    expect(values).toEqual(['2026-09-17', '2026-10-01', '2026-10-08', '2026-10-15', '2026-11-05']);
  });

  it('blocks Continue until a date is chosen, then moves to details', () => {
    click(form.querySelector('[data-next]'));
    expect(form.querySelector('[data-error-for="meeting"]').textContent).toBe('Choose a Thursday.');
    expect(document.activeElement).toBe(form.querySelector('input[name="meeting"]'));
    form.querySelector('input[value="2026-10-01"]').checked = true;
    click(form.querySelector('[data-next]'));
    const [one, two] = form.querySelectorAll('[data-step]');
    expect(one.hidden).toBe(true);
    expect(two.hidden).toBe(false);
  });

  it('treats Enter on the first step as Continue, never as submit', () => {
    submit(form);
    expect(confirm.hidden).toBe(true);
    expect(form.querySelector('[data-error-for="meeting"]').hidden).toBe(false);
  });

  it('validates details, then confirms with a demo reference and a calendar file', () => {
    form.querySelector('input[value="2026-10-01"]').checked = true;
    form.querySelector('[name="guests"]').value = '2';
    click(form.querySelector('[data-next]'));
    submit(form);
    expect(form.querySelector('[data-error-for="name"]').hidden).toBe(false);
    expect(document.activeElement).toBe(form.querySelector('[name="name"]'));
    form.querySelector('[name="name"]').value = 'Sam <Lee>';
    form.querySelector('[name="email"]').value = 'sam@example.com';
    submit(form);
    expect(form.hidden).toBe(true);
    expect(confirm.hidden).toBe(false);
    expect(confirm.querySelector('[data-confirm-title]').textContent).toBe('You’re on the list for Thursday, October 1, 2026');
    expect(confirm.querySelector('[data-confirm-ref]').textContent).toBe('DEMO-AAAAAA');
    expect(confirm.textContent).toContain('Sam <Lee>');
    expect(confirm.textContent).toContain('2 people');
    click(confirm.querySelector('[data-add-calendar]'));
    expect(download).toHaveBeenCalledOnce();
    const [filename, ics] = download.mock.calls[0];
    expect(filename).toBe('exchange-club-meeting.ics');
    expect(ics).toContain('DTSTART:20261001T160000Z');
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('starts over from the first step', () => {
    form.querySelector('input[value="2026-10-01"]').checked = true;
    click(form.querySelector('[data-next]'));
    form.querySelector('[name="name"]').value = 'Sam';
    form.querySelector('[name="email"]').value = 'sam@example.com';
    submit(form);
    click(confirm.querySelector('[data-restart]'));
    expect(confirm.hidden).toBe(true);
    expect(form.hidden).toBe(false);
    expect(form.querySelector('[data-step]').hidden).toBe(false);
    expect(form.querySelector('input[name="meeting"]:checked')).toBeNull();
  });

  it('subscribes to every upcoming meeting in one file', () => {
    const subscribeDownload = vi.fn();
    mountSubscribe(document.querySelector('[data-subscribe]'), { now, download: subscribeDownload });
    click(document.querySelector('[data-subscribe]'));
    const [filename, ics] = subscribeDownload.mock.calls[0];
    expect(filename).toBe('exchange-club-meetings.ics');
    expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(5);
  });
});
```

- [ ] **Step 8: Run it to verify it fails**

Run: `npx vitest run tests/rsvp.test.js`
Expected: FAIL — `src/js/flows/rsvp.js` not found.

- [ ] **Step 9: Implement `src/js/flows/rsvp.js` and `src/js/pages/meetings.js`**

`src/js/flows/rsvp.js`:

```js
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

function choiceHtml(meeting) {
  const note = meeting.tentative ? ' · Tentative' : '';
  return (
    `<label class="choice"><input type="radio" name="meeting" value="${meeting.date}">` +
    `<span class="choice__label"><strong>${meetingDateParts(meeting.date).short}</strong>` +
    `<span>${CLUB.meeting.time} · ${CLUB.meeting.venue}${note}</span></span></label>`
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
```

`src/js/pages/meetings.js`:

```js
import { mountRsvp, mountSubscribe } from '../flows/rsvp.js';

mountRsvp(document.querySelector('[data-flow="rsvp"]'));
mountSubscribe(document.querySelector('[data-subscribe]'));
```

- [ ] **Step 10: Run the tests, then the gates**

Run: `npx vitest run tests/rsvp.test.js && npm test && npm run build && npm run check`
Expected: rsvp suite PASS (8 tests); full suite PASS; check-dist clean.

- [ ] **Step 11: Commit**

```bash
git add src/js/lib/stepper.js src/js/lib/form-errors.js src/js/lib/summary.js src/js/flows/rsvp.js src/js/pages/meetings.js src/styles/flows.css meetings.html tests/stepper.test.js tests/form-errors.test.js tests/summary.test.js tests/rsvp.test.js
git commit -F - <<'MSG'
feat: add meetings page with guest RSVP flow and shared flow libraries

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_019gmTqZ5kCmSQFTwxrVLfuk
MSG
```

---

### Task 11: Give page and donate flow

**Files:**
- Create: `src/data/funds.js`, `src/js/flows/donate.js`, `src/js/pages/give.js`
- Modify: `give.html` (sections after the page-hero), `src/styles/pages.css` (append the Give block)
- Test: `tests/donate.test.js`

**Interfaces:**
- Consumes: `createStepper`, `showErrors`, `clearErrors`, `fillSummary` (Task 10); `parseAmount`, `isValidAmount`, `isFilled`, `isEmail`, `formatUSD`, `demoRef`, `easternYmd` (Task 2); fund ids linked from Task 7 (`scholarships`, `child-abuse-prevention`, `community-grants`).
- Produces: `FUNDS`, `AMOUNTS`, `DEFAULT_AMOUNT` (`src/data/funds.js`); `fundFromQuery`, `giftAmount`, `validateGift`, `validateDetails`, `donationSummary`, `mountDonate` (`src/js/flows/donate.js`).

- [ ] **Step 1: Create `src/data/funds.js`**

```js
/** Funds a donor can choose (spec §6.1). `general` is the default. */
export const FUNDS = [
  { id: 'scholarships', name: 'Scholarships', blurb: 'Academic scholarships for Lowcountry students, awarded each March.' },
  { id: 'child-abuse-prevention', name: 'Child Abuse Prevention', blurb: 'Support for local partners such as the Dee Norton Child Advocacy Center.' },
  { id: 'community-grants', name: 'Fair Community Grants', blurb: 'Grants to local nonprofits, alongside what the fair raises.' },
  { id: 'general', name: 'Where it’s needed most', blurb: 'Lets the club put your gift where it will do the most good.' },
];
export const AMOUNTS = [50, 100, 250, 500];
export const DEFAULT_AMOUNT = 250;
```

- [ ] **Step 2: Add the Give sections** to `give.html` after the page-hero `</header>`, and `<script type="module" src="/src/js/pages/give.js"></script>` before `</body>`:

```html
  <section class="section" id="donate" aria-labelledby="donate-title">
    <div class="container give-layout">
      <div class="give-main">
        <h2 class="visually-hidden" id="donate-title">Make a gift</h2>
        <p class="demo-note no-js-only">The giving form needs JavaScript in this demo.</p>
        <form class="flow js-only" data-flow="donate" novalidate>
          <p class="demo-note">Nothing is charged or sent — this is a demo of the giving flow.</p>
          <ol class="stepper" data-stepper aria-label="Gift progress"><li>Your gift</li><li>Your details</li><li>Review</li></ol>
          <p class="visually-hidden" data-step-status aria-live="polite"></p>
          <p class="flow__status" data-form-status aria-live="polite"></p>

          <fieldset data-step data-step-title="Your gift">
            <legend tabindex="-1" data-step-heading>Choose where your gift goes</legend>
            <div class="choice-grid">
              <label class="choice"><input type="radio" name="fund" value="scholarships"><span class="choice__label"><strong>Scholarships</strong><span>Academic scholarships for Lowcountry students, awarded each March.</span></span></label>
              <label class="choice"><input type="radio" name="fund" value="child-abuse-prevention"><span class="choice__label"><strong>Child Abuse Prevention</strong><span>Support for local partners such as the Dee Norton Child Advocacy Center.</span></span></label>
              <label class="choice"><input type="radio" name="fund" value="community-grants"><span class="choice__label"><strong>Fair Community Grants</strong><span>Grants to local nonprofits, alongside what the fair raises.</span></span></label>
              <label class="choice"><input type="radio" name="fund" value="general" checked><span class="choice__label"><strong>Where it’s needed most</strong><span>Lets the club put your gift where it will do the most good.</span></span></label>
            </div>
            <fieldset class="nested">
              <legend>Amount</legend>
              <div class="choice-grid choice-grid--compact">
                <label class="choice"><input type="radio" name="amount" value="50"><span class="choice__label">$50</span></label>
                <label class="choice"><input type="radio" name="amount" value="100"><span class="choice__label">$100</span></label>
                <label class="choice"><input type="radio" name="amount" value="250" checked><span class="choice__label">$250</span></label>
                <label class="choice"><input type="radio" name="amount" value="500"><span class="choice__label">$500</span></label>
                <label class="choice"><input type="radio" name="amount" value="custom"><span class="choice__label">Other</span></label>
              </div>
              <div class="field" data-custom-field hidden>
                <label for="gift-custom">Other amount, in whole dollars</label>
                <input id="gift-custom" name="custom" inputmode="numeric" autocomplete="off" aria-describedby="err-gift-custom">
                <p class="field__error" id="err-gift-custom" data-error-for="custom" hidden></p>
              </div>
            </fieldset>
            <fieldset class="nested">
              <legend>How often?</legend>
              <div class="choice-grid choice-grid--compact">
                <label class="choice"><input type="radio" name="frequency" value="once" checked><span class="choice__label">One-time</span></label>
                <label class="choice"><input type="radio" name="frequency" value="monthly"><span class="choice__label">Monthly</span></label>
              </div>
            </fieldset>
            <div class="flow__actions"><button class="btn btn--primary" type="button" data-next>Continue</button></div>
          </fieldset>

          <fieldset data-step data-step-title="Your details" hidden>
            <legend tabindex="-1" data-step-heading>Your details</legend>
            <div class="field-row">
              <div class="field">
                <label for="gift-first">First name</label>
                <input id="gift-first" name="first" autocomplete="given-name" aria-describedby="err-gift-first">
                <p class="field__error" id="err-gift-first" data-error-for="first" hidden></p>
              </div>
              <div class="field">
                <label for="gift-last">Last name</label>
                <input id="gift-last" name="last" autocomplete="family-name" aria-describedby="err-gift-last">
                <p class="field__error" id="err-gift-last" data-error-for="last" hidden></p>
              </div>
            </div>
            <div class="field">
              <label for="gift-email">Email</label>
              <input id="gift-email" name="email" type="email" autocomplete="email" aria-describedby="err-gift-email">
              <p class="field__error" id="err-gift-email" data-error-for="email" hidden></p>
            </div>
            <label class="check"><input type="checkbox" name="tributeOn"> <span>Dedicate this gift to someone</span></label>
            <div class="tribute" data-tribute hidden>
              <fieldset class="nested">
                <legend>Dedication</legend>
                <div class="choice-grid choice-grid--compact">
                  <label class="choice"><input type="radio" name="tributeType" value="honor" checked><span class="choice__label">In honor of</span></label>
                  <label class="choice"><input type="radio" name="tributeType" value="memory"><span class="choice__label">In memory of</span></label>
                </div>
              </fieldset>
              <div class="field">
                <label for="gift-tribute-name">Their name</label>
                <input id="gift-tribute-name" name="tributeName" autocomplete="off" aria-describedby="err-gift-tribute">
                <p class="field__error" id="err-gift-tribute" data-error-for="tributeName" hidden></p>
              </div>
            </div>
            <div class="flow__actions">
              <button class="btn btn--secondary" type="button" data-back>Back</button>
              <button class="btn btn--primary" type="button" data-next>Review your gift</button>
            </div>
          </fieldset>

          <fieldset data-step data-step-title="Review" hidden>
            <legend tabindex="-1" data-step-heading>Review your gift</legend>
            <dl class="summary" data-summary></dl>
            <div class="payment-placeholder">
              <strong>Secure payment</strong>
              <p>In production this step hands off to the club’s payment processor. No payment is collected in this demo.</p>
            </div>
            <div class="flow__actions">
              <button class="btn btn--secondary" type="button" data-back>Back</button>
              <button class="btn btn--give" type="submit">Complete demo gift</button>
            </div>
          </fieldset>
        </form>
        <div class="confirm" data-confirm="donate" hidden tabindex="-1">
          <p class="confirm__badge">Demo receipt</p>
          <h3>Thank you, <span data-confirm-name></span>.</h3>
          <dl class="summary" data-confirm-summary></dl>
          <p>Reference <span class="confirm__ref" data-confirm-ref></span> · <time data-confirm-date></time></p>
          <p class="demo-note">No money moved. In production the club’s payment processor would email your receipt.</p>
          <div class="btn-row"><button class="btn btn--secondary" type="button" data-restart>Give again</button></div>
        </div>
      </div>
      <aside class="give-aside">
        <figure class="photo">
          <img src="/src/assets/img/give-scholar-960.webp" srcset="/src/assets/img/give-scholar-480.webp 480w, /src/assets/img/give-scholar-960.webp 960w, /src/assets/img/give-scholar-1600.webp 1600w" sizes="(min-width: 1000px) 35vw, 100vw" width="1600" height="1067" loading="lazy" decoding="async" alt="A scholarship recipient shakes hands with the club president">
          <figcaption>A 2024 scholarship recipient with the club president.</figcaption>
        </figure>
        <p><strong>Every gift stays in the Lowcountry.</strong> Gifts and fair proceeds fund scholarships, community grants and child-abuse prevention.</p>
        <p class="club-note">Tax status and receipts: club to confirm</p>
      </aside>
    </div>
  </section>

  <section class="section section--tint" aria-labelledby="other-title">
    <div class="container">
      <div class="section-head">
        <p class="eyebrow">More ways to help</p>
        <h2 id="other-title">Other ways to give</h2>
      </div>
      <div class="grid grid--3">
        <div class="cta-band__panel"><h3>Sponsor the fair</h3><p>Put your business in front of fairgoers while funding local giving.</p><a href="contact.html?topic=fair">Ask about sponsorship</a></div>
        <div class="cta-band__panel"><h3>Volunteer</h3><p>Fair workdays and fair shifts are how members give their time.</p><a href="join.html">Join the club</a></div>
        <div class="cta-band__panel"><h3>In-kind gifts</h3><p>Goods and services for the fair and our programs.</p><a href="contact.html?topic=donations">Talk to the treasurer</a></div>
      </div>
    </div>
  </section>
```

- [ ] **Step 3: Append the Give block to `src/styles/pages.css`**

```css
/* ---------- Give ---------- */
.give-layout { display: grid; align-items: start; gap: var(--space-7); }
@media (min-width: 1000px) { .give-layout { grid-template-columns: minmax(0, 1.5fr) minmax(0, 1fr); } }
.give-main, .give-aside { display: grid; gap: var(--space-4); }
.tribute { display: grid; gap: var(--space-4); padding-left: var(--space-4); border-left: 2px solid var(--rule); }
```

- [ ] **Step 4: Write the failing test `tests/donate.test.js`**

```js
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { loadPage } from './helpers/load-page.js';
import { fundFromQuery, giftAmount, validateGift, validateDetails, donationSummary, mountDonate } from '../src/js/flows/donate.js';

const click = (el) => el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
const change = (el) => el.dispatchEvent(new Event('change', { bubbles: true }));
const submit = (form) => form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
const base = { fund: 'general', amount: 250, custom: '', frequency: 'once', tributeOn: false, tributeType: 'honor', tributeName: '', first: 'Ann', last: 'Lee', email: 'ann@example.com' };

describe('donation rules', () => {
  it('reads the fund from the query string, defaulting to general', () => {
    expect(fundFromQuery('?fund=scholarships')).toBe('scholarships');
    expect(fundFromQuery('?fund=bogus')).toBe('general');
    expect(fundFromQuery('')).toBe('general');
  });

  it('accepts presets and whole-dollar custom amounts from $5 to $100,000', () => {
    expect(giftAmount(base)).toBe(250);
    expect(validateGift(base)).toEqual({});
    expect(giftAmount({ ...base, amount: 'custom', custom: '$1,250' })).toBe(1250);
    expect(validateGift({ ...base, amount: 'custom', custom: '4' })).toEqual({ custom: 'Enter a whole-dollar amount between $5 and $100,000.' });
    expect(validateGift({ ...base, amount: 'custom', custom: '12.50' })).toHaveProperty('custom');
  });

  it('requires names, a valid email and a dedication name when dedicating', () => {
    expect(validateDetails(base)).toEqual({});
    expect(validateDetails({ ...base, first: '', last: ' ', email: 'no' })).toEqual({
      first: 'Enter your first name.',
      last: 'Enter your last name.',
      email: 'Enter an email address like name@example.com.',
    });
    expect(validateDetails({ ...base, tributeOn: true })).toEqual({ tributeName: 'Enter the name of the person you’re honoring.' });
  });

  it('summarizes one-time and monthly gifts', () => {
    expect(donationSummary(base)).toEqual({ fund: 'Where it’s needed most', line: '$250 one-time', tribute: null });
    expect(donationSummary({ ...base, fund: 'scholarships', amount: 100, frequency: 'monthly', tributeOn: true, tributeType: 'memory', tributeName: ' Pat ' })).toEqual({
      fund: 'Scholarships',
      line: '$100 per month ($1,200 per year)',
      tribute: 'In memory of Pat',
    });
  });
});

describe('donate flow on the give page', () => {
  let form;
  let confirm;
  let fetchSpy;
  beforeEach(() => {
    loadPage('give.html');
    fetchSpy = vi.spyOn(globalThis, 'fetch');
    form = document.querySelector('[data-flow="donate"]');
    confirm = document.querySelector('[data-confirm="donate"]');
    mountDonate(form, { search: '?fund=scholarships', random: () => 0, now: () => new Date('2026-09-12T15:00:00-04:00') });
  });
  afterEach(() => fetchSpy.mockRestore());

  it('preselects the fund from the link and has no card fields anywhere', () => {
    expect(form.querySelector('input[name="fund"]:checked').value).toBe('scholarships');
    expect(document.querySelector('input[autocomplete^="cc-"]')).toBeNull();
    expect([...document.querySelectorAll('input')].some((input) => /card/i.test(input.name))).toBe(false);
  });

  it('reveals the custom amount and validates it', () => {
    const other = form.querySelector('input[name="amount"][value="custom"]');
    other.checked = true;
    change(other);
    expect(form.querySelector('[data-custom-field]').hidden).toBe(false);
    form.querySelector('[name="custom"]').value = '3';
    click(form.querySelector('[data-step]:not([hidden]) [data-next]'));
    expect(form.querySelector('[data-error-for="custom"]').hidden).toBe(false);
    expect(document.activeElement).toBe(form.querySelector('[name="custom"]'));
  });

  it('never skips validation when Enter submits an early step', () => {
    submit(form);
    expect(confirm.hidden).toBe(true);
    expect(form.querySelectorAll('[data-step]')[1].hidden).toBe(false);
  });

  it('walks gift → details → review → demo receipt', () => {
    click(form.querySelector('[data-step]:not([hidden]) [data-next]'));
    click(form.querySelector('[data-step]:not([hidden]) [data-next]'));
    expect(form.querySelector('[data-error-for="first"]').hidden).toBe(false);
    form.querySelector('[name="first"]').value = 'Ann';
    form.querySelector('[name="last"]').value = 'Lee';
    form.querySelector('[name="email"]').value = 'ann@example.com';
    const dedicate = form.querySelector('[name="tributeOn"]');
    dedicate.checked = true;
    change(dedicate);
    expect(form.querySelector('[data-tribute]').hidden).toBe(false);
    form.querySelector('[name="tributeName"]').value = 'Pat';
    click(form.querySelector('[data-step]:not([hidden]) [data-next]'));
    const review = form.querySelectorAll('[data-step]')[2];
    expect(review.hidden).toBe(false);
    expect(review.querySelector('[data-summary]').textContent).toContain('Scholarships');
    expect(review.querySelector('[data-summary]').textContent).toContain('$250 one-time');
    expect(review.querySelector('[data-summary]').textContent).toContain('In honor of Pat');
    submit(form);
    expect(form.hidden).toBe(true);
    expect(confirm.hidden).toBe(false);
    expect(confirm.querySelector('[data-confirm-name]').textContent).toBe('Ann');
    expect(confirm.querySelector('[data-confirm-ref]').textContent).toBe('DEMO-AAAAAA');
    expect(confirm.querySelector('[data-confirm-date]').textContent).toBe('September 12, 2026');
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('gives again from a clean first step with the linked fund', () => {
    click(form.querySelector('[data-step]:not([hidden]) [data-next]'));
    form.querySelector('[name="first"]').value = 'Ann';
    form.querySelector('[name="last"]').value = 'Lee';
    form.querySelector('[name="email"]').value = 'ann@example.com';
    click(form.querySelector('[data-step]:not([hidden]) [data-next]'));
    submit(form);
    click(confirm.querySelector('[data-restart]'));
    expect(form.hidden).toBe(false);
    expect(form.querySelector('[data-step]').hidden).toBe(false);
    expect(form.querySelector('input[name="fund"]:checked').value).toBe('scholarships');
    expect(form.querySelector('[name="first"]').value).toBe('');
  });
});
```

- [ ] **Step 5: Run it to verify it fails**

Run: `npx vitest run tests/donate.test.js`
Expected: FAIL — `src/js/flows/donate.js` not found.

- [ ] **Step 6: Implement `src/js/flows/donate.js` and `src/js/pages/give.js`**

`src/js/flows/donate.js`:

```js
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
  const radio = (name) => form.querySelector(`input[name="${name}"]:checked`)?.value ?? '';
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
```

`src/js/pages/give.js`:

```js
import { mountDonate } from '../flows/donate.js';

mountDonate(document.querySelector('[data-flow="donate"]'), { search: window.location.search });
```

- [ ] **Step 7: Run the tests, then the gates**

Run: `npx vitest run tests/donate.test.js && npm test && npm run build && npm run check`
Expected: donate suite PASS (9 tests); full suite PASS; check-dist clean.

- [ ] **Step 8: Commit**

```bash
git add src/data/funds.js src/js/flows/donate.js src/js/pages/give.js give.html src/styles/pages.css tests/donate.test.js
git commit -F - <<'MSG'
feat: add Give page with the demo donation flow

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_019gmTqZ5kCmSQFTwxrVLfuk
MSG
```

---

### Task 12: Join page and membership application flow

**Files:**
- Create: `src/js/flows/join.js`, `src/js/pages/join.js`
- Modify: `join.html` (sections after the page-hero)
- Test: `tests/join.test.js`

**Interfaces:**
- Consumes: `createStepper`, `showErrors`, `clearErrors` (Task 10); `isFilled`, `isEmail`, `isUsPhone`, `demoRef` (Task 2).
- Produces: `INTERESTS`, `validateContact`, `validateAbout`, `mountJoin`.

- [ ] **Step 1: Add the Join sections** to `join.html` after the page-hero `</header>`, and `<script type="module" src="/src/js/pages/join.js"></script>` before `</body>`:

```html
  <section class="section" aria-labelledby="why-title">
    <div class="container">
      <div class="section-head">
        <p class="eyebrow">Why join</p>
        <h2 id="why-title">Bring out the best in yourself — and in Charleston</h2>
      </div>
      <div class="grid grid--3">
        <div class="cta-band__panel"><h3>Lead</h3><p>Build leadership and organizational skills that carry into business, family and personal life.</p></div>
        <div class="cta-band__panel"><h3>Connect</h3><p>Get to know Charleston professionals over lunch every Thursday.</p></div>
        <div class="cta-band__panel"><h3>Serve</h3><p>From a fair workday to a child-abuse prevention program, you’ll see the difference firsthand.</p></div>
      </div>
    </div>
  </section>

  <section class="section section--tint" aria-labelledby="involves-title">
    <div class="container split">
      <div class="prose">
        <h2 id="involves-title">What membership involves</h2>
        <ul>
          <li>Lunch at noon every Thursday at the Charleston Rifle Club.</li>
          <li>Volunteer shifts at the Coastal Carolina Fair and at fair workdays through the year.</li>
          <li>A committee that fits your interests — from membership to scholarships.</li>
          <li>Annual dues. <span class="club-note">Amount: club to confirm</span></li>
        </ul>
        <p>Not sure yet? <a href="meetings.html#rsvp">Come to a lunch as our guest</a> first.</p>
      </div>
      <figure class="photo">
        <img src="/src/assets/img/join-members-960.webp" srcset="/src/assets/img/join-members-480.webp 480w, /src/assets/img/join-members-960.webp 960w, /src/assets/img/join-members-1600.webp 1600w" sizes="(min-width: 900px) 50vw, 100vw" width="1600" height="1067" loading="lazy" decoding="async" alt="Two members at the 2026 Spring Festival">
      </figure>
    </div>
  </section>

  <section class="section" aria-labelledby="faq-title">
    <div class="container">
      <h2 id="faq-title">Questions</h2>
      <div class="faq">
        <details><summary>Can I visit before I apply?</summary><p>Yes. Guests are welcome at Thursday lunches marked “Guests welcome” — <a href="meetings.html#rsvp">reserve a seat</a>.</p></details>
        <details><summary>When and where do you meet?</summary><p>Thursdays at 12:00 PM at the Charleston Rifle Club, 2221 Heriot St, Charleston.</p></details>
        <details><summary>What does the fair ask of members?</summary><p>Members volunteer during the fair and at workdays through the year. <span class="club-note">Expected hours: club to confirm</span></p></details>
        <details><summary>How much are dues?</summary><p><span class="club-note">Dues: club to confirm</span></p></details>
      </div>
    </div>
  </section>

  <section class="section section--tint" id="apply" aria-labelledby="apply-title">
    <div class="container">
      <div class="section-head">
        <p class="eyebrow">Two short steps</p>
        <h2 id="apply-title">Start your application</h2>
      </div>
      <p class="demo-note no-js-only">The application needs JavaScript in this demo.</p>
      <form class="flow js-only" data-flow="join" novalidate>
        <p class="demo-note">Nothing is sent — this application stays in your browser.</p>
        <ol class="stepper" data-stepper aria-label="Application progress"><li>Contact</li><li>About you</li></ol>
        <p class="visually-hidden" data-step-status aria-live="polite"></p>
        <p class="flow__status" data-form-status aria-live="polite"></p>
        <fieldset data-step data-step-title="Contact">
          <legend tabindex="-1" data-step-heading>How can we reach you?</legend>
          <div class="field-row">
            <div class="field">
              <label for="join-first">First name</label>
              <input id="join-first" name="first" autocomplete="given-name" aria-describedby="err-join-first">
              <p class="field__error" id="err-join-first" data-error-for="first" hidden></p>
            </div>
            <div class="field">
              <label for="join-last">Last name</label>
              <input id="join-last" name="last" autocomplete="family-name" aria-describedby="err-join-last">
              <p class="field__error" id="err-join-last" data-error-for="last" hidden></p>
            </div>
          </div>
          <div class="field-row">
            <div class="field">
              <label for="join-email">Email</label>
              <input id="join-email" name="email" type="email" autocomplete="email" aria-describedby="err-join-email">
              <p class="field__error" id="err-join-email" data-error-for="email" hidden></p>
            </div>
            <div class="field">
              <label for="join-phone">Phone <span class="field__hint">(optional)</span></label>
              <input id="join-phone" name="phone" type="tel" autocomplete="tel" aria-describedby="err-join-phone">
              <p class="field__error" id="err-join-phone" data-error-for="phone" hidden></p>
            </div>
          </div>
          <div class="flow__actions"><button class="btn btn--primary" type="button" data-next>Continue</button></div>
        </fieldset>
        <fieldset data-step data-step-title="About you" hidden>
          <legend tabindex="-1" data-step-heading>About you</legend>
          <div class="field-row">
            <div class="field">
              <label for="join-occupation">Occupation or business <span class="field__hint">(optional)</span></label>
              <input id="join-occupation" name="occupation" autocomplete="organization-title">
            </div>
            <div class="field">
              <label for="join-heard">How did you hear about us?</label>
              <select id="join-heard" name="heard">
                <option value="">Choose one…</option>
                <option value="member">A member</option>
                <option value="fair">The Coastal Carolina Fair</option>
                <option value="event">A club event</option>
                <option value="online">Online</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
          <fieldset class="nested">
            <legend>What interests you? Choose at least one.</legend>
            <div class="choice-grid">
              <label class="check"><input type="checkbox" name="interests" value="fair"> <span>Fair operations</span></label>
              <label class="check"><input type="checkbox" name="interests" value="youth"> <span>Scholarships &amp; youth</span></label>
              <label class="check"><input type="checkbox" name="interests" value="child-abuse-prevention"> <span>Child abuse prevention</span></label>
              <label class="check"><input type="checkbox" name="interests" value="americanism"> <span>Americanism &amp; military</span></label>
              <label class="check"><input type="checkbox" name="interests" value="community"> <span>Community service</span></label>
            </div>
            <p class="field__error" data-error-for="interests" hidden></p>
          </fieldset>
          <div class="flow__actions">
            <button class="btn btn--secondary" type="button" data-back>Back</button>
            <button class="btn btn--primary" type="submit">Send application</button>
          </div>
        </fieldset>
      </form>
      <div class="confirm" data-confirm="join" hidden tabindex="-1">
        <p class="confirm__badge">Demo — application received</p>
        <h3>Thanks, <span data-confirm-name></span>. We’ll be in touch.</h3>
        <p>Your next step: join us as a guest at a Thursday lunch.</p>
        <p>Reference <span class="confirm__ref" data-confirm-ref></span></p>
        <div class="btn-row"><a class="btn btn--primary" href="meetings.html#rsvp">Reserve a guest seat</a></div>
        <p class="demo-note">In production this would go to the Membership Committee chair. Here, nothing left your browser.</p>
      </div>
    </div>
  </section>
```

- [ ] **Step 2: Write the failing test `tests/join.test.js`**

```js
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { loadPage } from './helpers/load-page.js';
import { INTERESTS, validateContact, validateAbout, mountJoin } from '../src/js/flows/join.js';

const click = (el) => el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
const submit = (form) => form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

describe('application rules', () => {
  it('requires names and email; checks phone only when given', () => {
    expect(validateContact({ first: '', last: '', email: '', phone: '' })).toEqual({
      first: 'Enter your first name.',
      last: 'Enter your last name.',
      email: 'Enter an email address like name@example.com.',
    });
    expect(validateContact({ first: 'A', last: 'B', email: 'a@b.co', phone: '555-0142' })).toEqual({ phone: 'Enter a 10-digit US phone number.' });
    expect(validateContact({ first: 'A', last: 'B', email: 'a@b.co', phone: '(843) 555-0142' })).toEqual({});
  });

  it('requires at least one interest', () => {
    expect(validateAbout({ interests: [] })).toEqual({ interests: 'Choose at least one interest.' });
    expect(validateAbout({ interests: ['fair'] })).toEqual({});
    expect(INTERESTS.map((i) => i.id)).toEqual(['fair', 'youth', 'child-abuse-prevention', 'americanism', 'community']);
  });
});

describe('application flow on the join page', () => {
  let form;
  let confirm;
  let fetchSpy;
  beforeEach(() => {
    loadPage('join.html');
    fetchSpy = vi.spyOn(globalThis, 'fetch');
    form = document.querySelector('[data-flow="join"]');
    confirm = document.querySelector('[data-confirm="join"]');
    mountJoin(form, { random: () => 0 });
  });
  afterEach(() => fetchSpy.mockRestore());

  it('matches the page checkboxes to INTERESTS', () => {
    expect([...form.querySelectorAll('[name="interests"]')].map((c) => c.value)).toEqual(INTERESTS.map((i) => i.id));
  });

  it('treats Enter on step one as Continue', () => {
    submit(form);
    expect(confirm.hidden).toBe(true);
    expect(form.querySelector('[data-error-for="first"]').hidden).toBe(false);
  });

  it('moves through both steps to a demo confirmation', () => {
    form.querySelector('[name="first"]').value = 'Ann';
    form.querySelector('[name="last"]').value = 'Lee';
    form.querySelector('[name="email"]').value = 'ann@example.com';
    click(form.querySelector('[data-next]'));
    expect(form.querySelectorAll('[data-step]')[1].hidden).toBe(false);
    submit(form);
    expect(form.querySelector('[data-error-for="interests"]').textContent).toBe('Choose at least one interest.');
    form.querySelector('[name="interests"][value="fair"]').checked = true;
    submit(form);
    expect(form.hidden).toBe(true);
    expect(confirm.hidden).toBe(false);
    expect(confirm.querySelector('[data-confirm-name]').textContent).toBe('Ann');
    expect(confirm.querySelector('[data-confirm-ref]').textContent).toBe('DEMO-AAAAAA');
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('goes back without losing entries', () => {
    form.querySelector('[name="first"]').value = 'Ann';
    form.querySelector('[name="last"]').value = 'Lee';
    form.querySelector('[name="email"]').value = 'ann@example.com';
    click(form.querySelector('[data-next]'));
    click(form.querySelector('[data-back]'));
    expect(form.querySelectorAll('[data-step]')[0].hidden).toBe(false);
    expect(form.querySelector('[name="first"]').value).toBe('Ann');
  });
});
```

- [ ] **Step 3: Run it to verify it fails**

Run: `npx vitest run tests/join.test.js`
Expected: FAIL — `src/js/flows/join.js` not found.

- [ ] **Step 4: Implement `src/js/flows/join.js` and `src/js/pages/join.js`**

`src/js/flows/join.js`:

```js
import { isEmail, isFilled, isUsPhone } from '../lib/validate.js';
import { demoRef } from '../lib/ref.js';
import { createStepper } from '../lib/stepper.js';
import { clearErrors, showErrors } from '../lib/form-errors.js';

export const INTERESTS = [
  { id: 'fair', label: 'Fair operations' },
  { id: 'youth', label: 'Scholarships & youth' },
  { id: 'child-abuse-prevention', label: 'Child abuse prevention' },
  { id: 'americanism', label: 'Americanism & military' },
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
```

`src/js/pages/join.js`:

```js
import { mountJoin } from '../flows/join.js';

mountJoin(document.querySelector('[data-flow="join"]'));
```

- [ ] **Step 5: Run the tests, then the gates**

Run: `npx vitest run tests/join.test.js && npm test && npm run build && npm run check`
Expected: join suite PASS (6 tests); full suite PASS; check-dist clean.

- [ ] **Step 6: Commit**

```bash
git add src/js/flows/join.js src/js/pages/join.js join.html tests/join.test.js
git commit -F - <<'MSG'
feat: add Join page with the membership application flow

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_019gmTqZ5kCmSQFTwxrVLfuk
MSG
```

---

### Task 13: Contact page and contact flow

**Files:**
- Create: `src/js/flows/contact.js`, `src/js/pages/contact.js`
- Modify: `contact.html` (sections after the page-hero), `src/styles/pages.css` (append the Contact block)
- Test: `tests/contact.test.js`

**Interfaces:**
- Consumes: `showErrors`, `clearErrors` (Task 10); `isFilled`, `isEmail`, `demoRef` (Task 2). Deep links `contact.html?topic=board|fair|donations` from Tasks 6, 8, 11.
- Produces: `TOPICS`, `topicFromQuery`, `routeText`, `validateMessage`, `mountContact`.

- [ ] **Step 1: Add the Contact sections** to `contact.html` after the page-hero `</header>`, and `<script type="module" src="/src/js/pages/contact.js"></script>` before `</body>`:

```html
  <section class="section" aria-labelledby="message-title">
    <div class="container contact-layout">
      <div class="contact-main">
        <h2 id="message-title">Send a message</h2>
        <p class="demo-note no-js-only">The contact form needs JavaScript in this demo.</p>
        <form class="flow js-only" data-flow="contact" novalidate>
          <p class="demo-note">Nothing is sent — this message stays in your browser.</p>
          <p class="flow__status" data-form-status aria-live="polite"></p>
          <div class="field-row">
            <div class="field">
              <label for="contact-name">Your name</label>
              <input id="contact-name" name="name" autocomplete="name" aria-describedby="err-contact-name">
              <p class="field__error" id="err-contact-name" data-error-for="name" hidden></p>
            </div>
            <div class="field">
              <label for="contact-email">Email</label>
              <input id="contact-email" name="email" type="email" autocomplete="email" aria-describedby="err-contact-email">
              <p class="field__error" id="err-contact-email" data-error-for="email" hidden></p>
            </div>
          </div>
          <div class="field">
            <label for="contact-topic">Topic</label>
            <select id="contact-topic" name="topic" aria-describedby="contact-route">
              <option value="general">General question</option>
              <option value="membership">Membership</option>
              <option value="fair">The Coastal Carolina Fair</option>
              <option value="donations">Donations</option>
              <option value="media">Media</option>
              <option value="board">The board</option>
            </select>
            <p class="field__hint" id="contact-route" data-route aria-live="polite">Goes to the club secretary (in production).</p>
          </div>
          <div class="field">
            <label for="contact-message">Message</label>
            <textarea id="contact-message" name="message" aria-describedby="err-contact-message"></textarea>
            <p class="field__error" id="err-contact-message" data-error-for="message" hidden></p>
          </div>
          <div class="flow__actions"><button class="btn btn--primary" type="submit">Send message</button></div>
        </form>
        <div class="confirm" data-confirm="contact" hidden tabindex="-1">
          <p class="confirm__badge">Demo — message received</p>
          <h3>Thanks, <span data-confirm-name></span>.</h3>
          <p>Your message about <strong data-confirm-topic></strong> would go to <span data-confirm-route></span>.</p>
          <p>Reference <span class="confirm__ref" data-confirm-ref></span></p>
          <p class="demo-note">Nothing left your browser.</p>
          <div class="btn-row"><button class="btn btn--secondary" type="button" data-restart>Send another message</button></div>
        </div>
      </div>
      <aside class="contact-aside prose">
        <h2>Visit</h2>
        <p><strong>Thursday lunch</strong><br>12:00 PM · Charleston Rifle Club<br>2221 Heriot St, Charleston, SC 29403</p>
        <p><strong>The fair</strong><br>Exchange Park<br>9850 Highway 78, Ladson, SC 29456</p>
        <h2>Follow</h2>
        <ul>
          <li><a href="https://www.facebook.com/ExchangeClubofCharlestonSC" rel="noopener">Exchange Club of Charleston on Facebook</a></li>
          <li><a href="https://www.facebook.com/CoastalCarolinaFair" rel="noopener">Coastal Carolina Fair on Facebook</a></li>
        </ul>
      </aside>
    </div>
  </section>
```

- [ ] **Step 2: Append the Contact block to `src/styles/pages.css`**

```css
/* ---------- Contact ---------- */
.contact-layout { display: grid; align-items: start; gap: var(--space-7); }
@media (min-width: 1000px) { .contact-layout { grid-template-columns: minmax(0, 1.6fr) minmax(0, 1fr); } }
.contact-main { display: grid; gap: var(--space-4); }
```

- [ ] **Step 3: Write the failing test `tests/contact.test.js`**

```js
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
```

- [ ] **Step 4: Run it to verify it fails**

Run: `npx vitest run tests/contact.test.js`
Expected: FAIL — `src/js/flows/contact.js` not found.

- [ ] **Step 5: Implement `src/js/flows/contact.js` and `src/js/pages/contact.js`**

`src/js/flows/contact.js`:

```js
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
```

`src/js/pages/contact.js`:

```js
import { mountContact } from '../flows/contact.js';

mountContact(document.querySelector('[data-flow="contact"]'), { search: window.location.search });
```

- [ ] **Step 6: Run the tests, then the gates**

Run: `npx vitest run tests/contact.test.js && npm test && npm run build && npm run check`
Expected: contact suite PASS (5 tests); full suite PASS; check-dist clean.

- [ ] **Step 7: Commit**

```bash
git add src/js/flows/contact.js src/js/pages/contact.js contact.html src/styles/pages.css tests/contact.test.js
git commit -F - <<'MSG'
feat: add Contact page with topic-routed demo form

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_019gmTqZ5kCmSQFTwxrVLfuk
MSG
```

---

### Task 14: Member portal

**Files:**
- Create: `src/data/portal-demo.js`, `src/js/flows/portal.js`, `src/js/pages/portal.js`
- Modify: `portal.html` (sections after the page-hero), `src/styles/pages.css` (append the Portal block)
- Test: `tests/portal.test.js`

**Interfaces:**
- Consumes: `readJson`, `writeJson`, `removeKey` (Task 2); `.demo-note`, `.btn*`, `.field`, `.check`, `.btn--sm` (Tasks 3, 10).
- Produces: `PORTAL_SESSION_KEY = 'ecc.portal'`, `PORTAL_STATE_KEY = 'ecc.portal.state'` (Task 15's privacy page names them), `initialPortalState`, `shiftCount`, `isFull`, `toggleShift`, `toggleCommittee`, `filterRoster`, `mountPortal`.

- [ ] **Step 1: Create `src/data/portal-demo.js`** (every person is fictional)

```js
/** Fictional data for the member-portal preview. No real members appear here. */
export const DEMO_MEMBER = { first: 'Jordan', last: 'Avery', since: 2019, duesPaidThrough: 'June 30, 2027', committees: ['Fair Operations'] };

export const SHIFTS = [
  { id: 'workday-oct-3', title: 'Fair workday — grounds prep', date: '2026-10-03', time: '8:00 AM – 12:00 PM', capacity: 20, filled: 14 },
  { id: 'workday-oct-17', title: 'Fair workday — gates and signage', date: '2026-10-17', time: '8:00 AM – 12:00 PM', capacity: 16, filled: 16 },
  { id: 'opening-gate', title: 'Opening night — Gate 1 tickets', date: '2026-10-29', time: '2:30 – 7:00 PM', capacity: 8, filled: 5 },
  { id: 'senior-day', title: 'Senior Day — hospitality tent', date: '2026-11-04', time: '9:30 AM – 2:30 PM', capacity: 10, filled: 7 },
  { id: 'saturday-parking', title: 'Saturday — parking, lot 2B', date: '2026-11-07', time: '10:00 AM – 4:00 PM', capacity: 12, filled: 9 },
  { id: 'closing-crew', title: 'Closing night — breakdown crew', date: '2026-11-08', time: '5:00 – 10:00 PM', capacity: 15, filled: 6 },
];

export const COMMITTEES = ['Membership', 'Fair Operations', 'Scholarship', 'Programs', 'Fellowship'];

export const ROSTER = [
  { name: 'Marcus Bell', committee: 'Fair Operations', since: 2011 },
  { name: 'Elaine Carter', committee: 'Scholarship', since: 2016 },
  { name: 'Theo Dawson', committee: 'Programs', since: 2020 },
  { name: 'Renee Ellison', committee: 'Membership', since: 2008 },
  { name: 'Grant Fowler', committee: 'Fair Operations', since: 2014 },
  { name: 'Priya Nair', committee: 'Fellowship', since: 2022 },
  { name: 'Wes Hollis', committee: 'Fair Operations', since: 2005 },
  { name: 'Dana Ingram', committee: 'Scholarship', since: 2018 },
  { name: 'Calvin Joyner', committee: 'Programs', since: 2012 },
  { name: 'Leah Kimball', committee: 'Membership', since: 2021 },
  { name: 'Russ Lamar', committee: 'Fair Operations', since: 1998 },
  { name: 'Nina Moreau', committee: 'Fellowship', since: 2019 },
  { name: 'Owen Pruitt', committee: 'Scholarship', since: 2010 },
  { name: 'Tessa Quinlan', committee: 'Programs', since: 2023 },
  { name: 'Victor Ruiz', committee: 'Fair Operations', since: 2017 },
  { name: 'Hannah Sykes', committee: 'Membership', since: 2015 },
  { name: 'Andre Talley', committee: 'Fair Operations', since: 2009 },
  { name: 'Megan Upchurch', committee: 'Fellowship', since: 2024 },
  { name: 'Luis Vega', committee: 'Programs', since: 2013 },
  { name: 'Carla Whitfield', committee: 'Scholarship', since: 2007 },
  { name: 'Ben Yates', committee: 'Fair Operations', since: 2002 },
  { name: 'Sofia Zeller', committee: 'Membership', since: 2025 },
  { name: 'Isaac Brandt', committee: 'Programs', since: 2016 },
  { name: 'Kara Lindqvist', committee: 'Fellowship', since: 2020 },
];

export const ANNOUNCEMENTS = [
  { date: '2026-10-29', label: 'Oct 29', text: 'The fair opens Thursday, October 29 — gates at 3:00 PM.' },
  { date: '2026-09-17', label: 'Sep 17', text: 'Next Thursday lunch: September 17 at the Charleston Rifle Club.' },
  { date: '2026-09-12', label: 'Sep 12', text: 'Fair shift sign-ups are open — pick yours below.' },
];
```

- [ ] **Step 2: Add the portal sections** to `portal.html` after the page-hero `</header>`, and `<script type="module" src="/src/js/pages/portal.js"></script>` before `</body>`:

```html
  <section class="section" aria-labelledby="portal-title">
    <div class="container">
      <h2 class="visually-hidden" id="portal-title">Member portal preview</h2>
      <p class="demo-note no-js-only">The member portal preview needs JavaScript.</p>
      <div class="portal js-only" data-portal>
        <div class="portal-gate" data-portal-gate>
          <h3>Sign in</h3>
          <p>In production, members sign in with their own account. This preview uses a fictional member and fictional data — nothing you do here leaves your browser.</p>
          <button class="btn btn--primary" type="button" data-portal-enter>Continue as demo member</button>
        </div>
        <div class="portal-dash" data-portal-dash hidden>
          <div class="portal-dash__bar">
            <p class="demo-note">Demo data — fictional members</p>
            <div class="btn-row">
              <button class="btn btn--secondary btn--sm" type="button" data-portal-reset>Reset demo</button>
              <button class="btn btn--secondary btn--sm" type="button" data-portal-signout>Sign out</button>
            </div>
          </div>
          <h3 tabindex="-1" data-portal-welcome>Welcome back, Jordan</h3>
          <div class="portal-grid">
            <div class="portal-main">
              <section class="portal-card" aria-labelledby="shifts-title">
                <h4 id="shifts-title">Fair workdays &amp; shifts</h4>
                <ul class="shift-list" data-shifts></ul>
              </section>
              <section class="portal-card" aria-labelledby="roster-title">
                <h4 id="roster-title">Roster</h4>
                <div class="field">
                  <label for="roster-filter">Filter by name or committee</label>
                  <input id="roster-filter" type="search" autocomplete="off" data-roster-filter>
                </div>
                <p class="card__meta" data-roster-count aria-live="polite"></p>
                <ul class="roster" data-roster></ul>
              </section>
            </div>
            <div class="portal-side">
              <section class="portal-card" aria-labelledby="dues-title">
                <h4 id="dues-title">Dues</h4>
                <p class="portal-status">Paid through June 30, 2027</p>
                <p class="card__meta">Member since 2019</p>
              </section>
              <section class="portal-card" aria-labelledby="committees-title">
                <h4 id="committees-title">Committees</h4>
                <ul class="committee-list" data-committees></ul>
              </section>
              <section class="portal-card" aria-labelledby="news-title">
                <h4 id="news-title">Announcements</h4>
                <ul class="announce-list" data-announcements></ul>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
```

- [ ] **Step 3: Append the Portal block to `src/styles/pages.css`**

```css
/* ---------- Member portal ---------- */
.portal-gate { display: grid; gap: var(--space-4); max-width: 40rem; padding: var(--space-6); background: var(--paper); border: 1px solid var(--rule); border-radius: var(--radius-lg); box-shadow: var(--shadow-1); }
.portal-gate .btn { justify-self: start; }
.portal-dash { display: grid; gap: var(--space-5); }
.portal-dash__bar { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: var(--space-3); }
.portal-dash > h3 { font: 400 var(--step-2) / 1.1 var(--font-serif); }
.portal-dash > h3:focus { outline: none; }
.portal-grid { display: grid; gap: var(--space-5); }
@media (min-width: 900px) { .portal-grid { grid-template-columns: minmax(0, 2fr) minmax(0, 1fr); } }
.portal-main, .portal-side { display: grid; align-content: start; gap: var(--space-5); }
.portal-card { display: grid; align-content: start; gap: var(--space-3); padding: var(--space-5); background: var(--paper); border: 1px solid var(--rule); border-radius: var(--radius-lg); }
.portal-card h4 { color: var(--navy); font: 700 1.15rem / 1.3 var(--font-serif); }
.portal-status { color: var(--success); font-weight: 700; }
.shift-list, .committee-list, .announce-list, .roster { display: grid; gap: var(--space-2); margin: 0; padding: 0; list-style: none; }
.shift { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: var(--space-3); padding-top: var(--space-3); border-top: 1px solid var(--rule); }
.shift:first-child { padding-top: 0; border-top: 0; }
.shift__title { color: var(--navy); font-weight: 700; }
.shift__meta { color: var(--muted); font-size: var(--step--1); font-variant-numeric: tabular-nums; }
.announce-list li { display: grid; grid-template-columns: 4rem 1fr; gap: var(--space-2); }
.announce-list time { color: var(--gold-ink); font-size: var(--step--1); font-weight: 700; font-variant-numeric: tabular-nums; }
.roster { grid-template-columns: repeat(auto-fill, minmax(min(100%, 13rem), 1fr)); gap: 0 var(--space-4); }
.roster li { display: grid; padding: var(--space-2) 0; border-top: 1px solid var(--rule); }
.roster__name { font-weight: 600; }
.roster__meta { color: var(--muted); font-size: var(--step--1); }
```

- [ ] **Step 4: Write the failing test `tests/portal.test.js`**

```js
import { describe, it, expect, beforeEach } from 'vitest';
import { loadPage } from './helpers/load-page.js';
import { SHIFTS, ROSTER } from '../src/data/portal-demo.js';
import {
  PORTAL_SESSION_KEY, PORTAL_STATE_KEY, initialPortalState, shiftCount, isFull, toggleShift, toggleCommittee, filterRoster, mountPortal,
} from '../src/js/flows/portal.js';

const memory = () => {
  const map = new Map();
  return { getItem: (k) => (map.has(k) ? map.get(k) : null), setItem: (k, v) => map.set(k, String(v)), removeItem: (k) => map.delete(k) };
};
const click = (el) => el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
const byId = (id) => SHIFTS.find((s) => s.id === id);

describe('portal state', () => {
  it('starts with the demo member’s committee and no shifts', () => {
    expect(initialPortalState()).toEqual({ shifts: [], committees: ['Fair Operations'] });
  });

  it('signs up for and withdraws from shifts, respecting capacity', () => {
    const start = initialPortalState();
    const signed = toggleShift(start, 'opening-gate');
    expect(signed.shifts).toEqual(['opening-gate']);
    expect(shiftCount(byId('opening-gate'), signed)).toBe(6);
    expect(toggleShift(signed, 'opening-gate').shifts).toEqual([]);
    expect(isFull(byId('workday-oct-17'), start)).toBe(true);
    expect(toggleShift(start, 'workday-oct-17')).toBe(start);
    expect(start.shifts).toEqual([]);
  });

  it('joins and leaves committees without mutating state', () => {
    const start = initialPortalState();
    const joined = toggleCommittee(start, 'Scholarship');
    expect(joined.committees).toEqual(['Fair Operations', 'Scholarship']);
    expect(toggleCommittee(joined, 'Fair Operations').committees).toEqual(['Scholarship']);
    expect(start.committees).toEqual(['Fair Operations']);
  });

  it('filters the roster by name or committee, case-insensitively', () => {
    expect(filterRoster(ROSTER, '')).toHaveLength(24);
    expect(filterRoster(ROSTER, 'bell').map((m) => m.name)).toEqual(['Marcus Bell']);
    expect(filterRoster(ROSTER, 'FELLOWSHIP')).toHaveLength(4);
  });
});

describe('portal page', () => {
  let session;
  let storage;
  const mount = () => mountPortal(document.querySelector('[data-portal]'), { session, storage });
  beforeEach(() => {
    loadPage('portal.html');
    session = memory();
    storage = memory();
  });

  it('shows the gate with no password field, then enters the dashboard', () => {
    mount();
    expect(document.querySelector('[data-portal-gate]').hidden).toBe(false);
    expect(document.querySelector('input[type="password"]')).toBeNull();
    click(document.querySelector('[data-portal-enter]'));
    expect(session.getItem(PORTAL_SESSION_KEY)).toBe('demo');
    expect(document.querySelector('[data-portal-dash]').hidden).toBe(false);
    expect(document.activeElement).toBe(document.querySelector('[data-portal-welcome]'));
    expect(document.querySelectorAll('[data-shifts] li')).toHaveLength(6);
    expect(document.querySelectorAll('[data-roster] li')).toHaveLength(24);
    expect(document.querySelector('[data-roster-count]').textContent).toBe('24 members');
  });

  it('remembers the demo session and saved shifts', () => {
    session.setItem(PORTAL_SESSION_KEY, 'demo');
    storage.setItem(PORTAL_STATE_KEY, JSON.stringify({ shifts: ['senior-day'], committees: ['Programs'] }));
    mount();
    expect(document.querySelector('[data-portal-dash]').hidden).toBe(false);
    expect(document.querySelector('[data-shift="senior-day"]').textContent).toBe('Withdraw');
    expect(document.querySelector('[data-committee="Programs"]').checked).toBe(true);
  });

  it('signs up for a shift, saves it and keeps focus on the button', () => {
    session.setItem(PORTAL_SESSION_KEY, 'demo');
    mount();
    click(document.querySelector('[data-shift="opening-gate"]'));
    const button = document.querySelector('[data-shift="opening-gate"]');
    expect(button.textContent).toBe('Withdraw');
    expect(document.activeElement).toBe(button);
    expect(JSON.parse(storage.getItem(PORTAL_STATE_KEY)).shifts).toEqual(['opening-gate']);
    expect(document.querySelector('[data-shift="workday-oct-17"]').disabled).toBe(true);
  });

  it('filters the roster and resets or signs out', () => {
    session.setItem(PORTAL_SESSION_KEY, 'demo');
    mount();
    const filter = document.querySelector('[data-roster-filter]');
    filter.value = 'scholar';
    filter.dispatchEvent(new Event('input', { bubbles: true }));
    expect(document.querySelectorAll('[data-roster] li')).toHaveLength(4);
    expect(document.querySelector('[data-roster-count]').textContent).toBe('4 of 24 members');
    click(document.querySelector('[data-shift="opening-gate"]'));
    click(document.querySelector('[data-portal-reset]'));
    expect(storage.getItem(PORTAL_STATE_KEY)).toBeNull();
    expect(document.querySelector('[data-shift="opening-gate"]').textContent).toBe('Sign up');
    click(document.querySelector('[data-portal-signout]'));
    expect(session.getItem(PORTAL_SESSION_KEY)).toBeNull();
    expect(document.querySelector('[data-portal-gate]').hidden).toBe(false);
  });
});
```

- [ ] **Step 5: Run it to verify it fails**

Run: `npx vitest run tests/portal.test.js`
Expected: FAIL — `src/js/flows/portal.js` not found.

- [ ] **Step 6: Implement `src/js/flows/portal.js` and `src/js/pages/portal.js`**

`src/js/flows/portal.js`:

```js
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

export function mountPortal(root, { session = window.sessionStorage, storage = window.localStorage } = {}) {
  if (!root) return;
  const doc = root.ownerDocument;
  const $ = (selector) => root.querySelector(selector);
  const gate = $('[data-portal-gate]');
  const dash = $('[data-portal-dash]');
  const filter = $('[data-roster-filter]');
  let state = readJson(storage, PORTAL_STATE_KEY, initialPortalState());

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
  renderAll();
  show(readJson(session, PORTAL_SESSION_KEY, null) === 'demo' || session.getItem?.(PORTAL_SESSION_KEY) === 'demo');

  $('[data-portal-enter]').addEventListener('click', () => {
    session.setItem(PORTAL_SESSION_KEY, 'demo');
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
```

Note on the session check: the value is stored as the plain string `demo` (not JSON), so the gate test uses `session.getItem(...) === 'demo'`. Simplify that line to `show(session.getItem(PORTAL_SESSION_KEY) === 'demo');` wrapped in `try { … } catch { show(false); }` — sessionStorage can throw when storage is blocked — and do the same `try/catch` around `session.setItem` in the enter handler. Only fictional, fixed strings are written with `innerHTML` above; nothing user-typed is.

`src/js/pages/portal.js`:

```js
import { mountPortal } from '../flows/portal.js';

mountPortal(document.querySelector('[data-portal]'));
```

- [ ] **Step 7: Run the tests, then the gates**

Run: `npx vitest run tests/portal.test.js && npm test && npm run build && npm run check`
Expected: portal suite PASS (8 tests); full suite PASS; check-dist clean.

- [ ] **Step 8: Screenshot check of every flow page** — with `npm run build` and `npx vite preview --port 5181 --strictPort` running, capture `meetings.html`, `give.html`, `join.html`, `contact.html`, `portal.html` at 1280 with Windows Chrome (Task 5 Step 7 commands). Expected: forms render as white `flow` cards with steppers; choice cards look like buttons; portal gate card visible. JS-driven states are covered by the tests.

- [ ] **Step 9: Commit**

```bash
git add src/data/portal-demo.js src/js/flows/portal.js src/js/pages/portal.js portal.html src/styles/pages.css tests/portal.test.js
git commit -F - <<'MSG'
feat: add member portal preview with fictional data

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_019gmTqZ5kCmSQFTwxrVLfuk
MSG
```

- [ ] **Step 10: End of Part 3 — merge and push**

```bash
git checkout main && git merge --no-ff feat/demo-site -F - <<'MSG' && git push origin main && git checkout feat/demo-site
Merge part 3: demo flows

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_019gmTqZ5kCmSQFTwxrVLfuk
MSG
```
