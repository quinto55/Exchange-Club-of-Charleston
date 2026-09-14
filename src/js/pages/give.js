import { mountDonate } from '../flows/donate.js';

mountDonate(document.querySelector('[data-flow="donate"]'), { search: window.location.search });
