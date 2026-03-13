import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@core': path.resolve(__dirname, '../core')
    },
    dedupe: ['three']
  },
  server: {
    fs: {
      allow: [path.resolve(__dirname, '..')]
    }
  }
});
