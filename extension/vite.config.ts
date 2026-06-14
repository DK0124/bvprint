import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { copyFileSync, mkdirSync, existsSync } from 'fs';

// Vite multi-entry build for Chrome MV3 extension
// Outputs: dist/content.js, dist/background.js, dist/popup/index.html, dist/print/index.html
// After build, manifest.json is copied from public/ to dist/

export default defineConfig({
  plugins: [
    react(),
    // Post-build: copy manifest.json and icons from public/ to dist/
    {
      name: 'copy-extension-assets',
      closeBundle() {
        if (!existsSync('dist')) mkdirSync('dist', { recursive: true });
        if (!existsSync('dist/icons')) mkdirSync('dist/icons', { recursive: true });
        copyFileSync('public/manifest.json', 'dist/manifest.json');
        const icons = ['icon16.png', 'icon48.png', 'icon128.png'];
        for (const icon of icons) {
          const src = `public/icons/${icon}`;
          if (existsSync(src)) {
            copyFileSync(src, `dist/icons/${icon}`);
          }
        }
      },
    },
  ],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'popup/index.html'),
        print: resolve(__dirname, 'print/index.html'),
        content: resolve(__dirname, 'src/content/index.ts'),
        background: resolve(__dirname, 'src/background/index.ts'),
      },
      output: {
        entryFileNames: (chunkInfo) => {
          if (chunkInfo.name === 'content' || chunkInfo.name === 'background') {
            return '[name].js';
          }
          return 'assets/[name]-[hash].js';
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const name = assetInfo.name ?? '';
          if (name.endsWith('.css')) {
            return 'assets/[name]-[hash][extname]';
          }
          return 'assets/[name]-[hash][extname]';
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
  },
});
