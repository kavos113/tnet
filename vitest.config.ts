import { resolve } from 'path';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@main': resolve(__dirname, 'apps/desktop/src'),
      '@preload': resolve(__dirname, 'apps/desktop/src/preload'),
      '@renderer': resolve(__dirname, 'apps/desktop/src/renderer/src'),
      '@shared': resolve(__dirname, 'packages/shared/src'),
      '@tnet/app-papers': resolve(__dirname, 'packages/app-papers/src'),
      '@tnet/app-markdown': resolve(__dirname, 'packages/app-markdown/src'),
      '@tnet/main-core': resolve(__dirname, 'packages/main-core/src'),
      '@tnet/renderer-core': resolve(__dirname, 'packages/renderer-core/src'),
      '@tnet/shared': resolve(__dirname, 'packages/shared/src'),
      '@tnet/ui': resolve(__dirname, 'packages/ui/src')
    }
  },
  test: {
    environment: 'happy-dom',
    include: [
      'apps/**/*.test.ts',
      'apps/**/*.test.tsx',
      'packages/**/*.test.ts',
      'packages/**/*.test.tsx'
    ],
    setupFiles: ['apps/desktop/src/renderer/src/test/setup.ts']
  }
});
