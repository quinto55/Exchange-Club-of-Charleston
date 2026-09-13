import { describe, it, expect } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { checkPage, internalRefs, resolveRef } from '../scripts/check-dist.mjs';

const page = ({ head = '', body = '<h1>Title</h1>' } = {}) => `<!doctype html><html><head>
<meta name="robots" content="noindex"><title>About · Exchange Club of Charleston</title>
<meta name="description" content="About the club.">
<link rel="canonical" href="https://quinto55.github.io/Exchange-Club-of-Charleston/about.html">
<meta property="og:title" content="About"><meta property="og:description" content="About the club.">
<meta property="og:url" content="https://quinto55.github.io/Exchange-Club-of-Charleston/about.html">
<meta property="og:image" content="https://quinto55.github.io/Exchange-Club-of-Charleston/og/og-default.png">
<meta name="twitter:card" content="summary_large_image">${head}</head><body>${body}</body></html>`;

describe('checkPage', () => {
  it('passes a complete page', () => {
    const result = checkPage(page());
    expect(result.problems).toEqual([]);
    expect(result.title).toBe('About · Exchange Club of Charleston');
    expect(result.description).toBe('About the club.');
  });

  it('flags heading problems', () => {
    expect(checkPage(page({ body: '<h1>A</h1><h1>B</h1>' })).problems).toContain('expected exactly one <h1>, found 2');
    expect(checkPage(page({ body: '<h1> </h1>' })).problems).toContain('empty <h1>');
    expect(checkPage(page({ body: '<h1>A</h1><h3>C</h3>' })).problems).toContain('heading level skips from h1 to h3');
    expect(checkPage(page({ body: '<h1>A</h1><h2></h2>' })).problems).toContain('empty <h2>');
  });

  it('flags images without alt or dimensions', () => {
    const { problems } = checkPage(page({ body: '<h1>A</h1><img src="a.webp"><img src="b.webp" alt="" width="1" height="1">' }));
    expect(problems.filter((p) => p.startsWith('img without alt'))).toHaveLength(1);
    expect(problems.filter((p) => p.startsWith('img without width/height'))).toHaveLength(1);
  });

  it('flags placeholder links, double encoding and duplicate ids', () => {
    const { problems } = checkPage(page({
      body: '<h1>A &amp;amp; B</h1><a href="">x</a><a href="http://www.google.com/ ">y</a><p id="d"></p><p id="d"></p>',
    }));
    expect(problems).toEqual(expect.arrayContaining([
      'empty href', 'google.com placeholder link', 'double-encoded &amp;amp;', 'duplicate id: d',
    ]));
  });

  it('flags missing metadata', () => {
    const { problems } = checkPage('<html><head><title>T</title></head><body><h1>A</h1></body></html>');
    expect(problems).toEqual(expect.arrayContaining([
      'missing meta description', 'missing robots noindex', 'missing og:title', 'missing og:image', 'missing twitter:card', 'missing canonical',
    ]));
  });
});

describe('internal references', () => {
  it('collects local href/src/srcset values and skips external ones', () => {
    const refs = internalRefs('<a href="about.html#x">a</a><a href="https://x.org">b</a><img src="/Exchange-Club-of-Charleston/assets/a.webp" srcset="/Exchange-Club-of-Charleston/assets/a.webp 480w, /Exchange-Club-of-Charleston/assets/b.webp 960w"><a href="#top">c</a><a href="mailto:a@b.c">d</a>');
    expect(refs).toEqual(['about.html#x', '/Exchange-Club-of-Charleston/assets/a.webp', '/Exchange-Club-of-Charleston/assets/a.webp', '/Exchange-Club-of-Charleston/assets/b.webp']);
  });

  it('resolves relative and base-absolute paths inside dist', () => {
    const dist = mkdtempSync(join(tmpdir(), 'dist-'));
    mkdirSync(join(dist, 'assets'));
    writeFileSync(join(dist, 'about.html'), '');
    writeFileSync(join(dist, 'assets', 'a.webp'), '');
    const from = join(dist, 'index.html');
    expect(resolveRef('about.html#x', from, dist)).toBe(true);
    expect(resolveRef('/Exchange-Club-of-Charleston/assets/a.webp', from, dist)).toBe(true);
    expect(resolveRef('missing.html', from, dist)).toBe(false);
    expect(resolveRef('/src/assets/a.webp', from, dist)).toBe(false);
  });
});
