// @vitest-environment node
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { describe, expect, it } from 'vitest';
import { createDirectory, movePath, readFile, renamePath } from '../fileService';
import { getFileTree } from '../fileTreeService';
import { loadSession } from '../sessionService';

const tempDir = async (name: string): Promise<string> => {
  return fs.mkdtemp(path.join(os.tmpdir(), `tnet-${name}-`));
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

  it('renames and moves files inside the workspace without overwriting', async () => {
    const root = await tempDir('move-file');
    await fs.writeFile(path.join(root, 'old.pdf'), 'content', 'utf-8');

    await renamePath({ rootDir: root, oldPath: 'old.pdf', newPath: 'renamed.pdf' });
    await expect(fs.readFile(path.join(root, 'renamed.pdf'), 'utf-8')).resolves.toBe('content');

    await fs.writeFile(path.join(root, 'existing.pdf'), 'exists', 'utf-8');
    await expect(
      movePath({ rootDir: root, oldPath: 'renamed.pdf', newPath: 'nested/moved.pdf' })
    ).resolves.toBeUndefined();
    await expect(fs.readFile(path.join(root, 'nested', 'moved.pdf'), 'utf-8')).resolves.toBe(
      'content'
    );
    await expect(
      movePath({ rootDir: root, oldPath: 'nested/moved.pdf', newPath: 'existing.pdf' })
    ).rejects.toThrow('destination already exists');
  });

  it('rejects rename and move paths outside the workspace', async () => {
    const root = await tempDir('move-unsafe');
    await fs.writeFile(path.join(root, 'old.pdf'), 'content', 'utf-8');

    await expect(
      movePath({ rootDir: root, oldPath: 'old.pdf', newPath: '../escape.pdf' })
    ).rejects.toThrow('inside rootDir');
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
});
