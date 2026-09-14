import { mountRsvp, mountSubscribe } from '../flows/rsvp.js';

mountRsvp(document.querySelector('[data-flow="rsvp"]'));
mountSubscribe(document.querySelector('[data-subscribe]'));
