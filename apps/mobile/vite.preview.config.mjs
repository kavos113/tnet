import { resolve } from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    outDir: 'app/build/generated/markdownPreviewAssets/markdown-preview',
    emptyOutDir: true,
    copyPublicDir: false,
    lib: {
      entry: resolve('preview/src/markdownPreview.ts'),
      name: 'TnetMarkdownPreview',
      formats: ['iife'],
      fileName: () => 'markdown-preview.js',
      cssFileName: 'markdown-preview'
    },
    rollupOptions: {
      output: {
        assetFileNames: '[name][extname]'
      }
    }
  }
});
