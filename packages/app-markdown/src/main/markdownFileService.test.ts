// @vitest-environment node
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { describe, expect, it } from 'vitest';
import { loadKeywordIndex } from './keywordService';
import {
  createMarkdownFile,
  deleteMarkdownFile,
  readMarkdownImage,
  renameMarkdownPath,
  saveMarkdownImage,
  writeMarkdownFile
} from './markdownFileService';
import type { MarkdownSessionFileStateStore } from './markdownSessionFileState';
import { emptySessionData, type SessionData } from '@tnet/shared/types/file';

const tempDir = async (name: string): Promise<string> => {
  return fs.mkdtemp(path.join(os.tmpdir(), `tnet-markdown-${name}-`));
};

const readJson = async <T>(filePath: string): Promise<T> => {
  return JSON.parse(await fs.readFile(filePath, 'utf-8')) as T;
};

const createMemorySessionStore = (): MarkdownSessionFileStateStore & {
  readSavedSession: () => SessionData;
  setSession: (session: SessionData) => void;
} => {
  let session = emptySessionData();
  return {
    loadSession: async () => session,
    saveSession: async (_rootDir, nextSession) => {
      session = nextSession;
    },
    readSavedSession: () => session,
    setSession: (nextSession) => {
      session = nextSession;
    }
  };
};

describe('markdownFileService', () => {
  it('creates markdown files with the restored UTF-8 template', async () => {
    const root = await tempDir('create-file');
    const filePath = path.join(root, 'nested', 'new.md');

    await createMarkdownFile({ rootDir: root, path: 'nested/new.md' });

    const content = await fs.readFile(filePath, 'utf-8');
    expect(content).toContain('螟画焚繝ｻ譚｡莉ｶ');
    expect(content).toContain('險ｼ譏・');
  });

  it('writes keyword indexes and injects generated keyword names', async () => {
    const root = await tempDir('keywords');
    const filePath = path.join(root, 'doc.md');

    await writeMarkdownFile({
      rootDir: root,
      path: 'doc.md',
      content: [
        '<keyword name="Manual">manual body</keyword>',
        '<keyword number-class="1" prefix="螳夂炊">generated body</keyword>'
      ].join('\n')
    });

    const saved = await fs.readFile(filePath, 'utf-8');
    expect(saved).toContain('name="螳夂炊 1.1"');

    const keywords = await loadKeywordIndex(root);
    expect(keywords).toMatchObject({
      Manual: filePath,
      '螳夂炊 1.1': filePath
    });

    const latest = await readJson<Record<string, number>>(path.join(root, '.tnet', 'latest.json'));
    expect(latest).toMatchObject({ '1': 1 });
  });

  it('saves pasted images under the workspace _images directory', async () => {
    const root = await tempDir('paste-image');

    const result = await saveMarkdownImage({
      rootDir: root,
      preferredName: 'clipboard.png',
      mimeType: 'image/png',
      contentBase64: Buffer.from('image-content').toString('base64')
    });

    expect(result.filename).toMatch(/^paste-\d+-clipboard\.png$/);
    await expect(fs.readFile(path.join(root, '_images', result.filename), 'utf-8')).resolves.toBe(
      'image-content'
    );
  });

  it('does not overwrite an existing pasted image filename', async () => {
    const root = await tempDir('paste-image-collision');

    const first = await saveMarkdownImage({
      rootDir: root,
      preferredName: 'clipboard.png',
      mimeType: 'image/png',
      contentBase64: Buffer.from('first').toString('base64')
    });
    const second = await saveMarkdownImage({
      rootDir: root,
      preferredName: 'clipboard.png',
      mimeType: 'image/png',
      contentBase64: Buffer.from('second').toString('base64')
    });

    expect(second.filename).not.toBe(first.filename);
    await expect(fs.readFile(path.join(root, '_images', first.filename), 'utf-8')).resolves.toBe(
      'first'
    );
    await expect(fs.readFile(path.join(root, '_images', second.filename), 'utf-8')).resolves.toBe(
      'second'
    );
  });

  it('reads workspace images as data URLs', async () => {
    const root = await tempDir('read-image');
    await fs.mkdir(path.join(root, '_images'));
    await fs.writeFile(path.join(root, '_images', 'image.png'), Buffer.from('image-content'));

    await expect(readMarkdownImage({ rootDir: root, filename: 'image.png' })).resolves.toEqual({
      dataUrl: `data:image/png;base64,${Buffer.from('image-content').toString('base64')}`
    });
  });

  it('updates markdown session and keyword indexes when deleting and renaming files', async () => {
    const root = await tempDir('mutations');
    const newPath = path.join(root, 'new.md');
    const sessionStore = createMemorySessionStore();

    await writeMarkdownFile({
      rootDir: root,
      path: 'old.md',
      content: '<keyword name="K1">body</keyword>'
    });
    sessionStore.setSession({
      explorer: {
        expandedFolders: ['folder']
      },
      apps: {
        markdown: {
          openedFiles: ['old.md'],
          editorLayout: {
            activeGroupId: 'secondary',
            isSecondaryGroupVisible: true,
            groupWidthPercent: 55,
            groups: {
              primary: {
                openedFiles: ['old.md'],
                activeIndex: 0,
                viewMode: 'split',
                isPreviewOutlineVisible: true
              },
              secondary: {
                openedFiles: ['old.md'],
                activeIndex: 0,
                viewMode: 'preview',
                isPreviewOutlineVisible: false
              }
            }
          }
        }
      }
    });
    await renameMarkdownPath({ rootDir: root, oldPath: 'old.md', newPath: 'new.md' }, sessionStore);

    expect(sessionStore.readSavedSession().apps.markdown.openedFiles).toEqual(['new.md']);
    expect(await loadKeywordIndex(root)).toMatchObject({ K1: newPath });

    await deleteMarkdownFile({ rootDir: root, path: 'new.md' }, sessionStore);

    expect(sessionStore.readSavedSession().apps.markdown.openedFiles).toEqual([]);
    expect((await loadKeywordIndex(root)).K1).toBeUndefined();
  });
});
