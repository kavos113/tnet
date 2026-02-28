import { resolve } from 'path';
import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@renderer': resolve(__dirname, 'src/renderer/src'),
      '@fixtures': resolve(__dirname, 'src/fixtures')
    }
  },
  test: {
    environment: 'happy-dom',
    include: ['**/*.test.ts']
  }
});
