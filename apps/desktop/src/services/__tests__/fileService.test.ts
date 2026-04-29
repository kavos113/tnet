// @vitest-environment node
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { describe, expect, it } from 'vitest';
import { createDirectory, readFile } from '../fileService';
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
