import { defineConfig } from 'vite';
import angular from '@analogjs/vite-plugin-angular';
import path from 'path';
import type { Plugin } from 'vite';

// Plugin to update base href in index.html based on the base path
function htmlBaseHrefPlugin(): Plugin {
  let config: any;
  return {
    name: 'html-base-href',
    configResolved(resolvedConfig) {
      config = resolvedConfig;
    },
    transformIndexHtml(html) {
      const base = config.base || '/';
      return html.replace(
        /<base href="[^"]*"\s*\/>/,
        `<base href="${base}"/>`
      );
    }
  };
}

export default defineConfig({
  plugins: [
    angular(),
    htmlBaseHrefPlugin(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(process.cwd(), 'src'),
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    target: 'es2020',
  },
  // GitHub Pages: set VITE_BASE='/cjtravel/' in CI
  // DigitalOcean: set VITE_BASE='/' (or leave unset to use default)
  // Note: Empty string is treated as a valid value; use null/undefined for default
  base: process.env.VITE_BASE ?? '/',
  server: {
    port: 4200,
  }
});
