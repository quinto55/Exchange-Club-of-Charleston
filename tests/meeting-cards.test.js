import { describe, it, expect } from 'vitest';
import { meetingCardHtml, renderMeetingCards } from '../src/js/lib/meeting-cards.js';

describe('meeting cards', () => {
  it('renders a place card with the date block, long date and a reserve link', () => {
    const html = meetingCardHtml({ date: '2026-09-17', title: 'Weekly Club Meeting', tentative: false });
    expect(html).toBe(
      '<li class="place-card"><p class="place-card__date" aria-hidden="true"><span class="place-card__month">SEP</span><span class="place-card__day">17</span></p><div class="place-card__body"><p class="place-card__title">Weekly Club Meeting</p><p class="place-card__meta"><time datetime="2026-09-17T12:00">Thursday, September 17, 2026</time> · 12:00 PM</p><p class="place-card__meta">Charleston Rifle Club</p><span class="place-card__tag">Guests welcome</span></div><a class="btn btn--secondary place-card__action" href="meetings.html#rsvp">Reserve a seat<span class="visually-hidden"> for Thursday, September 17, 2026</span></a></li>',
    );
  });

  it('labels tentative meetings and can omit the action', () => {
    const html = meetingCardHtml({ date: '2026-11-12', title: 'Weekly Club Meeting', tentative: true }, { action: 'none' });
    expect(html).toContain('place-card__tag--tentative">Tentative</span>');
    expect(html).not.toContain('<a ');
  });

  it('renders a list', () => {
    const ul = document.createElement('ul');
    renderMeetingCards(ul, [{ date: '2026-09-17', title: 'A' }, { date: '2026-10-01', title: 'B' }]);
    expect(ul.querySelectorAll('li.place-card')).toHaveLength(2);
  });
});
