import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { applyPartials } from '../../plugins/html-partials.js';

const root = resolve(import.meta.dirname, '../..');
const read = (name) => readFileSync(resolve(root, name), 'utf8');

/** Render a page's <body> (partials expanded, scripts removed) into the happy-dom document. */
export function loadPage(file, doc = document) {
  const html = applyPartials(read(file), read);
  const [, bodyAttrs, bodyHtml] = html.match(/<body([^>]*)>([\s\S]*)<\/body>/i);
  doc.documentElement.className = 'js';
  doc.body.dataset.page = bodyAttrs.match(/data-page="([^"]+)"/)?.[1] ?? '';
  doc.body.innerHTML = bodyHtml.replace(/<script\b[\s\S]*?<\/script>/gi, '');
  return doc;
}
