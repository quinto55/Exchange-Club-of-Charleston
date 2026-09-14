import { mountContact } from '../flows/contact.js';

mountContact(document.querySelector('[data-flow="contact"]'), { search: window.location.search });
