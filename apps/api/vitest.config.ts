import { defineConfig } from 'vitest/config';
import { readFileSync, existsSync } from 'node:fs';
import { transform, type Options as SwcOptions } from '@swc/core';
import type { Plugin } from 'vite';

const envPath = new URL('./.env', import.meta.url);
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (m && typeof process.env[m[1]] === 'undefined') process.env[m[1]] = m[2];
  }
}

// The QA suite runs against DATABASE_URL_TEST so the developer database
// (DATABASE_URL) can stay clean after a local data reset.
if (process.env.DATABASE_URL_TEST) {
  process.env.DATABASE_URL = process.env.DATABASE_URL_TEST;
}

const swcOptions: SwcOptions = {
  module: { type: 'es6' },
  jsc: {
    target: 'es2022',
    parser: { syntax: 'typescript', decorators: true },
    transform: { legacyDecorator: true, decoratorMetadata: true },
  },
};

const swcDecoratorMetadata = (): Plugin => ({
  name: 'swc-decorator-metadata',
  enforce: 'pre',
  async transform(code, id) {
    if (!/\.m?[jt]sx?$/.test(id) || id.includes('node_modules')) return;
    const out = await transform(code, { ...swcOptions, filename: id });
    return { code: out.code, map: out.map as unknown as string };
  },
});

export default defineConfig({
  plugins: [swcDecoratorMetadata()],
  test: {
    globals: true,
    include: ['test/**/*.e2e-spec.ts', 'src/**/*.{test,spec}.?(c|m)[jt]s?(x)'],
  },
});