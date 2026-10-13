import path from 'node:path';

import {
  fusionOpenPlugin,
  manifestCspPlugin,
  mkcertPlugin,
} from '@cognite/app-sdk/vite';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  // manifestCspPlugin() must stay first — its middleware sets the
  // Content-Security-Policy header before any HTML response is sent.
  plugins: [manifestCspPlugin(), react(), mkcertPlugin(), fusionOpenPlugin(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3001,
  },
  worker: {
    format: 'es',
  },
  optimizeDeps: {
    // Pre-bundling pdfjs-dist breaks the PDF.js worker used by CogniteFileViewer.
    exclude: ['pdfjs-dist'],
    // react-pdf is only imported lazily (when a document is opened); pre-bundle it at startup so the
    // dev server does not discover it mid-session and force a full page reload.
    include: ['react-pdf'],
  },
});
