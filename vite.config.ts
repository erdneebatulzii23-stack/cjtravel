import { defineConfig } from 'vite';
import angular from '@analogjs/vite-plugin-angular';

export default defineConfig({
  plugins: [angular()],
  build: {
    outDir: 'dist/client',
    emptyOutDir: true,
  },
  resolve: {
    mainFields: ['module'],
  },
});