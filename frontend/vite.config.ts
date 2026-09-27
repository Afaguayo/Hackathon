import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Production: built into the Next app's public/app/ and served at the site root (see next.config.ts),
// so the frontend and /api share one origin on Vercel.
// Development: `npm run dev` here (port 5173) + `npm run dev` in the repo root (Next API on port 3000);
// /api requests are proxied to Next.
export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: command === 'build' ? '/app/' : '/',
  build: {
    outDir: '../public/app',
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    open: true,
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
}));
