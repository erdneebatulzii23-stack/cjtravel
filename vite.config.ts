import { defineConfig } from 'vite';
import angular from '@analogjs/vite-plugin-angular';
import path from 'path';

export default defineConfig({
  plugins: [
    angular(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist/client',
    emptyOutDir: true,
    target: 'es2020',
  },
  // Base path-ийг '/' гэж өгөх нь DigitalOcean дээр хамгийн найдвартай
  base: '/',
  server: {
    port: 4200,
  }
});
