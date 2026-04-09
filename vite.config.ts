import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    // VitePWA disabled: workbox-build@7.4.0 has a schema bug (ajv CodeGen identifier error)
    // that causes the post-build SW generation to fail. Re-enable once workbox-build is patched.
  ],
  root: '.',
  build: {
    outDir: 'dist/frontend',
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src/frontend'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3939',
        changeOrigin: true,
      },
    },
  },
});
