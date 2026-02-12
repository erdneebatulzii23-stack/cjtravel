import { defineConfig } from 'vite';
import angular from '@analogjs/vite-plugin-angular';
import path from 'path';

export default defineConfig({
  plugins: [angular()],
  build: {
    outDir: 'dist/client',
    emptyOutDir: true,
  },
  resolve: {
    mainFields: ['module'],
    alias: {
      '@': path.resolve(process.cwd(), 'src'),
    },
  },
  define: {
    'process.env.API_KEY': JSON.stringify(process.env['API_KEY'] || ''),
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
      }
    }
  }
});
