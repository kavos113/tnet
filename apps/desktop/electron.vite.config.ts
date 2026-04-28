import { builtinModules } from 'module';
import { resolve } from 'path';
import { defineConfig } from 'electron-vite';
import react from '@vitejs/plugin-react';

const workspacePackages = [
  '@tnet/app-markdown',
  '@tnet/main-core',
  '@tnet/renderer-core',
  '@tnet/shared',
  '@tnet/ui'
];
const nodeExternal = [
  'electron',
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
        '@tnet/app-markdown': resolve('../../packages/app-markdown/src'),
        '@tnet/main-core': resolve('../../packages/main-core/src'),
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
        '@tnet/app-markdown': resolve('../../packages/app-markdown/src'),
        '@tnet/shared': resolve('../../packages/shared/src')
      }
    }
  },
  renderer: {
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src'),
        '@shared': resolve('../../packages/shared/src'),
        '@tnet/app-markdown': resolve('../../packages/app-markdown/src'),
        '@tnet/renderer-core': resolve('../../packages/renderer-core/src'),
        '@tnet/shared': resolve('../../packages/shared/src'),
        '@tnet/ui': resolve('../../packages/ui/src')
      }
    },
    plugins: [react()]
  }
});
