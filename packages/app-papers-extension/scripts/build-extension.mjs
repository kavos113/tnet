import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'vite';

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const distDir = path.join(packageRoot, 'dist');
const srcDir = path.join(packageRoot, 'src');

await rm(distDir, { recursive: true, force: true });
await mkdir(distDir, { recursive: true });

const sharedBuild = {
  configFile: false,
  base: './',
  root: packageRoot,
  publicDir: false,
  logLevel: 'info',
  resolve: {
    alias: {
      '@tnet/app-papers/shared': path.resolve(packageRoot, '..', 'app-papers', 'src', 'shared')
    }
  }
};

await build({
  ...sharedBuild,
  build: {
    emptyOutDir: false,
    outDir: distDir,
    lib: {
      entry: path.join(srcDir, 'background.ts'),
      name: 'TNetPaperConnectorBackground',
      formats: ['iife'],
      fileName: () => 'background.js'
    },
    rollupOptions: {
      output: {
        inlineDynamicImports: true
      }
    }
  }
});

await build({
  ...sharedBuild,
  build: {
    emptyOutDir: false,
    outDir: distDir,
    rollupOptions: {
      input: path.join(srcDir, 'popup', 'index.html')
    }
  }
});

const manifest = JSON.parse(await readFile(path.join(packageRoot, 'manifest.json'), 'utf8'));
manifest.background = {
  service_worker: 'background.js'
};
manifest.action = {
  ...manifest.action,
  default_popup: 'src/popup/index.html'
};

await mkdir(path.join(distDir, 'src', 'popup'), { recursive: true });
const popupHtml = await readFile(path.join(distDir, 'src', 'popup', 'index.html'), 'utf8');
await writeFile(
  path.join(distDir, 'popup.html'),
  popupHtml.replaceAll('../../assets/', './assets/')
);
await rm(path.join(distDir, 'src'), { recursive: true, force: true });
manifest.action.default_popup = 'popup.html';

await writeFile(path.join(distDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
