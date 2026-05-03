import { builtinModules, createRequire } from 'module';
import { dirname, join, resolve } from 'path';
import { defineConfig } from 'electron-vite';
import { normalizePath } from 'vite';
import { visualizer } from 'rollup-plugin-visualizer';
import react from '@vitejs/plugin-react';
import { viteStaticCopy } from 'vite-plugin-static-copy';

const analyze = process.env.ANALYZE === 'true';
const require = createRequire(import.meta.url);
const pdfjsDistDir = dirname(require.resolve('pdfjs-dist/package.json'));

const workspacePackages = [
  '@tnet/app-papers',
  '@tnet/app-markdown',
  '@tnet/app-requester',
  '@tnet/app-tasks',
  '@tnet/app-rss',
  '@tnet/app-pdf-viewer',
  '@tnet/app-db-inspector',
  '@tnet/main-core',
  '@tnet/markdown-editor',
  '@tnet/renderer-core',
  '@tnet/shared',
  '@tnet/ui'
];
const nodeExternal = [
  'electron',
  'better-sqlite3',
  'googleapis',
  'openai',
  '@google/genai',
  'pg-native',
  'bufferutil',
  'utf-8-validate',
  ...builtinModules,
  ...builtinModules.map((name) => `node:${name}`)
];

export default defineConfig({
  main: {
    ssr: {
      noExternal: workspacePackages
    },
    build: {
      rollupOptions: {
        input: resolve('src/index.ts'),
        external: nodeExternal
      }
    },
    resolve: {
      alias: {
        '@main': resolve('src'),
        '@shared': resolve('../../packages/shared/src'),
        '@tnet/app-papers': resolve('../../packages/app-papers/src'),
        '@tnet/app-markdown': resolve('../../packages/app-markdown/src'),
        '@tnet/app-requester': resolve('../../packages/app-requester/src'),
        '@tnet/app-tasks': resolve('../../packages/app-tasks/src'),
        '@tnet/app-rss': resolve('../../packages/app-rss/src'),
        '@tnet/app-pdf-viewer': resolve('../../packages/app-pdf-viewer/src'),
        '@tnet/app-db-inspector': resolve('../../packages/app-db-inspector/src'),
        '@tnet/main-core': resolve('../../packages/main-core/src'),
        '@tnet/markdown-editor': resolve('../../packages/markdown-editor/src'),
        '@tnet/shared': resolve('../../packages/shared/src')
      }
    }
  },
  preload: {
    ssr: {
      noExternal: workspacePackages
    },
    build: {
      rollupOptions: {
        input: resolve('src/preload/index.ts'),
        external: nodeExternal
      }
    },
    resolve: {
      alias: {
        '@preload': resolve('src/preload'),
        '@shared': resolve('../../packages/shared/src'),
        '@tnet/app-papers': resolve('../../packages/app-papers/src'),
        '@tnet/app-markdown': resolve('../../packages/app-markdown/src'),
        '@tnet/app-requester': resolve('../../packages/app-requester/src'),
        '@tnet/app-tasks': resolve('../../packages/app-tasks/src'),
        '@tnet/app-rss': resolve('../../packages/app-rss/src'),
        '@tnet/app-pdf-viewer': resolve('../../packages/app-pdf-viewer/src'),
        '@tnet/app-db-inspector': resolve('../../packages/app-db-inspector/src'),
        '@tnet/markdown-editor': resolve('../../packages/markdown-editor/src'),
        '@tnet/shared': resolve('../../packages/shared/src')
      }
    }
  },
  renderer: {
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src'),
        '@shared': resolve('../../packages/shared/src'),
        '@tnet/app-papers': resolve('../../packages/app-papers/src'),
        '@tnet/app-markdown': resolve('../../packages/app-markdown/src'),
        '@tnet/app-requester': resolve('../../packages/app-requester/src'),
        '@tnet/app-tasks': resolve('../../packages/app-tasks/src'),
        '@tnet/app-rss': resolve('../../packages/app-rss/src'),
        '@tnet/app-pdf-viewer': resolve('../../packages/app-pdf-viewer/src'),
        '@tnet/app-db-inspector': resolve('../../packages/app-db-inspector/src'),
        '@tnet/markdown-editor': resolve('../../packages/markdown-editor/src'),
        '@tnet/renderer-core': resolve('../../packages/renderer-core/src'),
        '@tnet/shared': resolve('../../packages/shared/src'),
        '@tnet/ui': resolve('../../packages/ui/src')
      }
    },
    plugins: [
      react(),
      viteStaticCopy({
        targets: [
          {
            src: normalizePath(join(pdfjsDistDir, 'cmaps', '*')),
            dest: 'pdfjs/cmaps',
            rename: { stripBase: true }
          },
          {
            src: normalizePath(join(pdfjsDistDir, 'standard_fonts', '*')),
            dest: 'pdfjs/standard_fonts',
            rename: { stripBase: true }
          }
        ]
      }),
      analyze &&
        visualizer({
          open: true,
          filename: 'bundle-analysis.html',
          gzipSize: true,
          brotliSize: true
        })
    ]
  }
});
