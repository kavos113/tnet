// @vitest-environment node
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { describe, expect, it } from 'vitest';
import {
  createDirectory,
  createFile,
  deleteFile,
  readImage,
  readFile,
  renamePath,
  saveImage,
  writeFile
} from '../fileService';
import { getFileTree } from '../fileTreeService';
import { loadKeywordIndex } from '../keywordService';
import { loadSession, saveSession } from '../sessionService';

const tempDir = async (name: string): Promise<string> => {
  return fs.mkdtemp(path.join(os.tmpdir(), `tnet-${name}-`));
};

const readJson = async <T>(filePath: string): Promise<T> => {
  return JSON.parse(await fs.readFile(filePath, 'utf-8')) as T;
};

describe('main file services', () => {
  it('sorts directories before files in file trees', async () => {
    const root = await tempDir('tree');
    await fs.mkdir(path.join(root, 'b-dir'));
    await fs.mkdir(path.join(root, 'a-dir'));
    await fs.writeFile(path.join(root, 'b.md'), 'b', 'utf-8');
    await fs.writeFile(path.join(root, 'a.md'), 'a', 'utf-8');

    const tree = await getFileTree(root);

    expect(tree.map((item) => item.name)).toEqual(['a-dir', 'b-dir', 'a.md', 'b.md']);
  });

  it('creates markdown files with the restored UTF-8 template', async () => {
    const root = await tempDir('create-file');
    const filePath = path.join(root, 'nested', 'new.md');

    await createFile({ rootDir: root, path: 'nested/new.md' });

    const content = await fs.readFile(filePath, 'utf-8');
    expect(content).toContain('変数・条件');
    expect(content).toContain('証明');
  });

  it('reads files from workspace-relative request paths', async () => {
    const root = await tempDir('read-relative');
    await fs.writeFile(path.join(root, 'note.md'), 'content', 'utf-8');

    await expect(readFile({ rootDir: root, path: 'note.md' })).resolves.toBe('content');
  });

  it('creates directories recursively and rejects existing directories', async () => {
    const root = await tempDir('create-dir');
    const dirPath = path.join(root, 'a', 'b');

    await createDirectory({ rootDir: root, path: 'a/b' });
    await expect(fs.stat(dirPath)).resolves.toMatchObject({});
    await expect(createDirectory({ rootDir: root, path: 'a/b' })).rejects.toThrow('already exists');
  });

  it('writes keyword indexes and injects generated keyword names', async () => {
    const root = await tempDir('keywords');
    const filePath = path.join(root, 'doc.md');

    await writeFile({
      rootDir: root,
      path: 'doc.md',
      content: [
        '<keyword name="Manual">manual body</keyword>',
        '<keyword number-class="1" prefix="定理">generated body</keyword>'
      ].join('\n')
    });

    const saved = await fs.readFile(filePath, 'utf-8');
    expect(saved).toContain('name="定理 1.1"');

    const keywords = await loadKeywordIndex(root);
    expect(keywords).toMatchObject({
      Manual: filePath,
      '定理 1.1': filePath
    });

    const latest = await readJson<Record<string, number>>(path.join(root, '.tnet', 'latest.json'));
    expect(latest).toMatchObject({ '1': 1 });
  });

  it('saves pasted images under the workspace _images directory', async () => {
    const root = await tempDir('paste-image');

    const result = await saveImage({
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

    const first = await saveImage({
      rootDir: root,
      preferredName: 'clipboard.png',
      mimeType: 'image/png',
      contentBase64: Buffer.from('first').toString('base64')
    });
    const second = await saveImage({
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

    await expect(readImage({ rootDir: root, filename: 'image.png' })).resolves.toEqual({
      dataUrl: `data:image/png;base64,${Buffer.from('image-content').toString('base64')}`
    });
  });

  it('loads old or invalid session files as an empty current session', async () => {
    const root = await tempDir('legacy-session');
    await fs.mkdir(path.join(root, '.tnet'));
    await fs.writeFile(path.join(root, '.tnet', 'session.json'), JSON.stringify(['a.md']));

    await expect(loadSession(root)).resolves.toEqual({
      explorer: { expandedFolders: [] },
      apps: { markdown: { openedFiles: [] } }
    });
  });

  it('updates session and keyword indexes when deleting and renaming files', async () => {
    const root = await tempDir('mutations');
    const newPath = path.join(root, 'new.md');

    await writeFile({
      rootDir: root,
      path: 'old.md',
      content: '<keyword name="K1">body</keyword>'
    });
    await saveSession(root, {
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
    await renamePath({ rootDir: root, oldPath: 'old.md', newPath: 'new.md' });

    expect(await loadSession(root)).toEqual({
      explorer: {
        expandedFolders: ['folder']
      },
      apps: {
        markdown: {
          openedFiles: ['new.md'],
          editorLayout: {
            activeGroupId: 'secondary',
            isSecondaryGroupVisible: true,
            groupWidthPercent: 55,
            groups: {
              primary: {
                openedFiles: ['new.md'],
                activeIndex: 0,
                viewMode: 'split',
                isPreviewOutlineVisible: true
              },
              secondary: {
                openedFiles: ['new.md'],
                activeIndex: 0,
                viewMode: 'preview',
                isPreviewOutlineVisible: false
              }
            }
          }
        }
      }
    });
    expect(await loadKeywordIndex(root)).toMatchObject({ K1: newPath });

    await deleteFile({ rootDir: root, path: 'new.md' });

    expect(await loadSession(root)).toEqual({
      explorer: {
        expandedFolders: ['folder']
      },
      apps: {
        markdown: {
          openedFiles: [],
          editorLayout: {
            activeGroupId: 'secondary',
            isSecondaryGroupVisible: true,
            groupWidthPercent: 55,
            groups: {
              primary: {
                openedFiles: [],
                activeIndex: 0,
                viewMode: 'split',
                isPreviewOutlineVisible: true
              },
              secondary: {
                openedFiles: [],
                activeIndex: 0,
                viewMode: 'preview',
                isPreviewOutlineVisible: false
              }
            }
          }
        }
      }
    });
    expect((await loadKeywordIndex(root)).K1).toBeUndefined();
  });
});
