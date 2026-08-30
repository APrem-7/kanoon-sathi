import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';

export default defineConfig({
  plugins: [react(), tailwindcss()],

  // GitHub Pages project sites are served from /<repo-name>/, not the
  // domain root, so every asset URL needs that prefix or icons/JS/CSS all
  // 404. Read from an env var (set by the deploy workflow to
  // /<repo-name>/) rather than hardcoding a repo name here — local dev
  // and `npm run build` stay at the root ('/') by default, unaffected.
  base: process.env.VITE_BASE_PATH || '/',

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  build: {
    rollupOptions: {
      output: {
        // Splits the heavy, rarely-changing animation libraries out of the
        // main entry chunk so a change to app code doesn't bust the cache
        // for all of them, and the app's own code — the part that
        // actually changes release to release — stays a smaller,
        // faster-to-parse chunk on its own. (react/react-dom were tried
        // here too, but Vite's dep pre-bundling already folds them in
        // elsewhere in build mode — manualChunks produced an empty chunk
        // for them rather than actually splitting anything out.)
        manualChunks: {
          'vendor-motion': ['framer-motion', 'gsap', '@react-spring/web'],
        },
      },
    },
  },

  server: {
    port: 5174,
    allowedHosts: true,
    hmr: false,

    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});