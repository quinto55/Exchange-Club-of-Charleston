#!/usr/bin/env node
// Post-build site lint: fails (exit 1) on any SEO, accessibility or link problem in dist/*.html.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

export const BASE = '/Exchange-Club-of-Charleston/';
const ORIGIN = 'https://quinto55.github.io/Exchange-Club-of-Charleston/';

const attr = (tag, name) => tag.match(new RegExp(`\\s${name}\\s*=\\s*"([^"]*)"`, 'i'))?.[1];
const text = (html) => html.replace(/<[^>]+>/g, '').trim();

export function checkPage(html) {
  const problems = [];
  const head = html.match(/<head>([\s\S]*?)<\/head>/i)?.[1] ?? '';
  const body = html.match(/<body\b[\s\S]*<\/body>/i)?.[0] ?? '';
  const metas = [...head.matchAll(/<meta\b[^>]*>/gi)].map((m) => m[0]);
  const byName = (n) => metas.find((t) => attr(t, 'name') === n);
  const byProp = (p) => metas.find((t) => attr(t, 'property') === p);

  const title = head.match(/<title>([\s\S]*?)<\/title>/i)?.[1]?.trim();
  if (!title) problems.push('missing <title>');
  const description = attr(byName('description') ?? '', 'content');
  if (!description) problems.push('missing meta description');
  if (attr(byName('robots') ?? '', 'content') !== 'noindex') problems.push('missing robots noindex');
  for (const p of ['og:title', 'og:description', 'og:url', 'og:image']) {
    if (!attr(byProp(p) ?? '', 'content')) problems.push(`missing ${p}`);
  }
  if (!byName('twitter:card')) problems.push('missing twitter:card');
  const canonical = [...head.matchAll(/<link\b[^>]*>/gi)].map((m) => m[0]).find((t) => attr(t, 'rel') === 'canonical');
  if (!attr(canonical ?? '', 'href')?.startsWith(ORIGIN)) problems.push('missing canonical');

  const h1s = [...body.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)].map((m) => text(m[1]));
  if (h1s.length !== 1) problems.push(`expected exactly one <h1>, found ${h1s.length}`);
  else if (!h1s[0]) problems.push('empty <h1>');
  let previous = 0;
  for (const m of body.matchAll(/<h([1-6])\b/gi)) {
    const level = Number(m[1]);
    if (previous && level > previous + 1) problems.push(`heading level skips from h${previous} to h${level}`);
    previous = level;
  }
  for (const m of body.matchAll(/<h([2-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi)) {
    if (!text(m[2])) problems.push(`empty <h${m[1]}>`);
  }
  for (const m of body.matchAll(/<img\b[^>]*>/gi)) {
    if (attr(m[0], 'alt') === undefined) problems.push(`img without alt: ${m[0].slice(0, 80)}`);
    if (!attr(m[0], 'width') || !attr(m[0], 'height')) problems.push(`img without width/height: ${m[0].slice(0, 80)}`);
  }
  if (/\shref=""/i.test(html)) problems.push('empty href');
  if (/href="https?:\/\/(www\.)?google\.com\/?\s*"/i.test(html)) problems.push('google.com placeholder link');
  if (html.includes('&amp;amp;')) problems.push('double-encoded &amp;amp;');
  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
  const duplicates = [...new Set(ids.filter((id, i) => ids.indexOf(id) !== i))];
  if (duplicates.length) problems.push(`duplicate id: ${duplicates.join(', ')}`);
  return { title, description, problems };
}

export function internalRefs(html) {
  const refs = [...html.matchAll(/\s(?:href|src)="([^"]+)"/gi)].map((m) => m[1]);
  for (const m of html.matchAll(/\ssrcset="([^"]+)"/gi)) {
    for (const part of m[1].split(',')) refs.push(part.trim().split(/\s+/)[0]);
  }
  return refs.filter((u) => !/^(https?:|mailto:|tel:|data:|#|javascript:)/i.test(u));
}

export function resolveRef(ref, fromFile, distDir) {
  const [path] = ref.split(/[?#]/);
  if (!path) return true;
  let full = null;
  if (path.startsWith(BASE)) full = join(distDir, decodeURI(path.slice(BASE.length)));
  else if (!path.startsWith('/')) full = resolve(dirname(fromFile), decodeURI(path));
  return full !== null && existsSync(full);
}

function main() {
  const dist = resolve(import.meta.dirname, '..', 'dist');
  if (!existsSync(dist)) {
    console.error('dist/ not found — run `npm run build` first.');
    process.exit(1);
  }
  const files = readdirSync(dist).filter((f) => f.endsWith('.html')).sort();
  const seenTitles = new Map();
  const seenDescriptions = new Map();
  let failures = 0;
  for (const file of files) {
    const path = join(dist, file);
    const html = readFileSync(path, 'utf8');
    const { title, description, problems } = checkPage(html);
    for (const ref of internalRefs(html)) {
      if (!resolveRef(ref, path, dist)) problems.push(`broken internal link: ${ref}`);
    }
    if (title && seenTitles.has(title)) problems.push(`duplicate <title> (also in ${seenTitles.get(title)})`);
    if (description && seenDescriptions.has(description)) problems.push(`duplicate description (also in ${seenDescriptions.get(description)})`);
    if (title) seenTitles.set(title, file);
    if (description) seenDescriptions.set(description, file);
    for (const problem of problems) console.error(`✗ ${file}: ${problem}`);
    failures += problems.length;
  }
  if (failures) {
    console.error(`\n${failures} problem(s) across ${files.length} pages.`);
    process.exit(1);
  }
  console.log(`✓ ${files.length} pages checked — no problems.`);
}

if (process.argv[1] && resolve(process.argv[1]) === import.meta.filename) main();
