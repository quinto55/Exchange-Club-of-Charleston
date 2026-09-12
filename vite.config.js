import { defineConfig } from 'vite';
import { readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { htmlPartials } from './plugins/html-partials.js';

const root = import.meta.dirname;

// Every root-level .html file is a page (flat site; relative links work under any base path).
const pages = Object.fromEntries(
  readdirSync(root)
    .filter((file) => file.endsWith('.html'))
    .map((file) => [file.replace(/\.html$/, ''), resolve(root, file)]),
);

export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/Exchange-Club-of-Charleston/' : '/',
  plugins: [htmlPartials({ root })],
  build: {
    assetsInlineLimit: 0,
    rollupOptions: { input: pages },
  },
  test: {
    environment: 'happy-dom',
    include: ['tests/**/*.test.js'],
  },
}));
