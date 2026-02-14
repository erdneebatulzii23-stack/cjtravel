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
    outDir: 'dist/client', // Server.js энэ хавтсыг хайж байгаа
    emptyOutDir: true,
    target: 'es2020',
  },
  // Base path-ийг заавал зааж өгнө
  base: '/',
  server: {
    port: 4200,
    // DigitalOcean дээр Proxy хэрэггүй (Server.js өөрөө статик файл уншуулж байгаа)
  },
  // "define" хэсгийг хассан (app.component.ts дээр import.meta.env ашиглаж байгаа тул)
});
