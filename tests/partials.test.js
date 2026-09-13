import { describe, it, expect } from 'vitest';
import { applyPartials } from '../plugins/html-partials.js';

const partials = {
  'partials/nav.html':
    '<nav><a href="index.html" data-nav="home">Home</a><a class="btn" href="give.html" data-nav="give">Give</a></nav>',
  'partials/outer.html': '<header><!-- @include partials/nav.html --></header>',
};
const read = (name) => {
  if (!(name in partials)) throw new Error(`html-partials: missing include "${name}"`);
  return partials[name];
};

describe('applyPartials', () => {
  it('replaces an include marker with the partial', () => {
    const out = applyPartials('<body><!-- @include partials/nav.html --></body>', read);
    expect(out).toContain('<nav><a href="index.html"');
    expect(out).not.toContain('@include');
  });

  it('expands nested includes', () => {
    const out = applyPartials('<body><!-- @include partials/outer.html --></body>', read);
    expect(out).toContain('<header><nav>');
    expect(out).not.toContain('@include');
  });

  it('marks the nav link matching body[data-page] as current', () => {
    const out = applyPartials('<body data-page="give"><!-- @include partials/nav.html --></body>', read);
    expect(out).toContain('data-nav="give" aria-current="page"');
    expect(out.match(/aria-current/g)).toHaveLength(1);
  });

  it('works when data-nav is the first attribute', () => {
    const out = applyPartials('<body data-page="x"><a data-nav="x" href="x.html">X</a></body>', () => '');
    expect(out).toContain('<a data-nav="x" aria-current="page" href="x.html">');
  });

  it('leaves links alone when the page has no data-page', () => {
    const out = applyPartials('<body><!-- @include partials/nav.html --></body>', read);
    expect(out).not.toContain('aria-current');
  });

  it('propagates a missing-include error', () => {
    expect(() => applyPartials('<!-- @include partials/nope.html -->', read)).toThrow(
      'html-partials: missing include "partials/nope.html"',
    );
  });

  it('throws when includes recurse forever', () => {
    const loop = () => '<!-- @include partials/loop.html -->';
    expect(() => applyPartials(loop(), loop)).toThrow('html-partials: includes nested too deeply');
  });
});
