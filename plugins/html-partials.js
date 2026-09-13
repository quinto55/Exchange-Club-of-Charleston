import { readFileSync } from 'node:fs';
import { resolve, sep } from 'node:path';

const INCLUDE = /<!--\s*@include\s+([\w./-]+\.html)\s*-->/g;
const HAS_INCLUDE = /<!--\s*@include\s+[\w./-]+\.html\s*-->/;
const MAX_DEPTH = 5;

/**
 * Expand `<!-- @include partials/NAME.html -->` markers (nested up to MAX_DEPTH),
 * then mark the nav link whose data-nav matches <body data-page> as the current page.
 * @param {string} html
 * @param {(name: string) => string} readPartial
 * @returns {string}
 */
export function applyPartials(html, readPartial) {
  let out = html;
  for (let depth = 0; HAS_INCLUDE.test(out); depth += 1) {
    if (depth === MAX_DEPTH) throw new Error('html-partials: includes nested too deeply');
    out = out.replace(INCLUDE, (_, name) => readPartial(name));
  }
  const page = out.match(/<body\b[^>]*\bdata-page="([\w-]+)"/)?.[1];
  if (page) {
    out = out.replace(
      new RegExp(`<a\\b([^>]*?)\\bdata-nav="${page}"`, 'g'),
      `<a$1data-nav="${page}" aria-current="page"`,
    );
  }
  return out;
}

/** Vite plugin: run applyPartials on every HTML page, reading partials from `root`. */
export function htmlPartials({ root }) {
  const readPartial = (name) => {
    try {
      return readFileSync(resolve(root, name), 'utf8');
    } catch {
      throw new Error(`html-partials: missing include "${name}"`);
    }
  };
  return {
    name: 'html-partials',
    transformIndexHtml: { order: 'pre', handler: (html) => applyPartials(html, readPartial) },
    configureServer(server) {
      server.watcher.add(resolve(root, 'partials'));
      server.watcher.on('change', (file) => {
        if (file.includes(`${sep}partials${sep}`)) server.ws.send({ type: 'full-reload' });
      });
    },
  };
}
