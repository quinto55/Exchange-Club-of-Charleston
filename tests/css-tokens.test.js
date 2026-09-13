import { it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const dir = resolve(import.meta.dirname, '../src/styles');
const COLOUR_LITERAL = /#[0-9a-fA-F]{3,8}\b|\brgba?\(|\bhsla?\(/;

it('keeps colour literals in tokens.css only', () => {
  const files = readdirSync(dir).filter((f) => f.endsWith('.css'));
  expect(files).toEqual(
    expect.arrayContaining(['main.css', 'tokens.css', 'base.css', 'components.css', 'shell.css', 'flows.css', 'pages.css']),
  );
  const offenders = files
    .filter((f) => f !== 'tokens.css')
    .flatMap((f) =>
      readFileSync(resolve(dir, f), 'utf8')
        .split('\n')
        .map((line, i) => ({ f, i: i + 1, line }))
        .filter(({ line }) => COLOUR_LITERAL.test(line)),
    )
    .map(({ f, i, line }) => `${f}:${i}: ${line.trim()}`);
  expect(offenders).toEqual([]);
});
