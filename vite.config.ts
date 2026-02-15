import { defineConfig } from 'vite';
import angular from '@analogjs/vite-plugin-angular';
import path from 'path';

export default defineConfig({
  plugins: [
    angular(),
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
