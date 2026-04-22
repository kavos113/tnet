// @vitest-environment node
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { describe, expect, it } from 'vitest';
import {
  rebuildWorkspaceSearchIndex,
  removeWorkspaceSearchPath,
  renameWorkspaceSearchPath,
  searchWorkspace,
  upsertWorkspaceSearchFile
} from '../workspaceSearchIndexService';

const tempDir = async (): Promise<string> => fs.mkdtemp(path.join(os.tmpdir(), 'tnet-search-'));

const writeFile = async (filePath: string, content: string): Promise<void> => {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, content, 'utf-8');
};

describe('workspaceSearchIndexService', () => {
  it('indexes markdown files and searches literal text case-insensitively', async () => {
    const root = await tempDir();
    await writeFile(path.join(root, 'note.md'), 'Alpha theorem\nbeta');
    await writeFile(path.join(root, 'nested', 'other.markdown'), 'contains ALPHA again');
    await writeFile(path.join(root, 'plain.txt'), 'Alpha should be ignored');

    await expect(rebuildWorkspaceSearchIndex(root)).resolves.toEqual({
      indexedFileCount: 2,
      indexedLineCount: 3
    });

    const result = await searchWorkspace({ rootDir: root, query: 'alpha' });

    expect(result.totalMatches).toBe(2);
    expect(result.files.map((file) => file.relativePath)).toEqual([
      'nested/other.markdown',
      'note.md'
    ]);
    expect(result.files[1].matches[0]).toMatchObject({
      lineNumber: 1,
      lineText: 'Alpha theorem',
      ranges: [{ start: 0, end: 5 }]
    });
  });

  it('excludes generated and dependency directories', async () => {
    const root = await tempDir();
    await writeFile(path.join(root, 'keep.md'), 'target');
    await writeFile(path.join(root, '.tnet', 'settings.md'), 'target');
    await writeFile(path.join(root, '_images', 'image.md'), 'target');
    await writeFile(path.join(root, '.git', 'ignored.md'), 'target');
    await writeFile(path.join(root, 'node_modules', 'ignored.md'), 'target');

    const result = await searchWorkspace({ rootDir: root, query: 'target' });

    expect(result.totalMatches).toBe(1);
    expect(result.files[0].relativePath).toBe('keep.md');
  });

  it('supports short Japanese and LaTeX literal queries', async () => {
    const root = await tempDir();
    await writeFile(path.join(root, 'math.md'), 'これは定理です\nUse \\alpha + \\beta.');

    const japanese = await searchWorkspace({ rootDir: root, query: '定理' });
    const latex = await searchWorkspace({ rootDir: root, query: '\\alpha' });

    expect(japanese.totalMatches).toBe(1);
    expect(japanese.files[0].matches[0].lineNumber).toBe(1);
    expect(latex.totalMatches).toBe(1);
    expect(latex.files[0].matches[0].ranges).toEqual([{ start: 4, end: 10 }]);
  });

  it('updates indexed files after upsert remove and rename operations', async () => {
    const root = await tempDir();
    const originalPath = path.join(root, 'note.md');
    const renamedPath = path.join(root, 'renamed.md');
    await writeFile(originalPath, 'before');
    await rebuildWorkspaceSearchIndex(root);

    await writeFile(originalPath, 'after');
    await upsertWorkspaceSearchFile(root, originalPath);
    expect(await searchWorkspace({ rootDir: root, query: 'before' })).toMatchObject({
      totalMatches: 0
    });
    expect(await searchWorkspace({ rootDir: root, query: 'after' })).toMatchObject({
      totalMatches: 1
    });

    await fs.rename(originalPath, renamedPath);
    await renameWorkspaceSearchPath({ rootDir: root, oldPath: originalPath, newPath: renamedPath });
    const renamed = await searchWorkspace({ rootDir: root, query: 'after' });
    expect(renamed.files[0].relativePath).toBe('renamed.md');

    await removeWorkspaceSearchPath(root, renamedPath);
    expect(await searchWorkspace({ rootDir: root, query: 'after' })).toMatchObject({
      totalMatches: 0
    });
  });
});
