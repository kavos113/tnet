import { describe, expect, it, vi } from 'vitest';
import path from 'path';
import os from 'os';
import fs from 'fs/promises';

import {
  createDirectory,
  createFile,
  deleteFile,
  getFileTree,
  loadSession,
  renamePath,
  readFile,
  saveSession,
  writeFile
} from '../file';

const readJson = async (filePath: string): Promise<unknown> => {
  const raw = await fs.readFile(filePath, 'utf-8');
  return JSON.parse(raw);
};

describe('src/main/file.ts', () => {
  it('getFileTree: ディレクトリ→ファイルの順でソートされる', async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'tnet-tree-'));
    await fs.mkdir(path.join(root, 'b-dir'));
    await fs.mkdir(path.join(root, 'a-dir'));
    await fs.writeFile(path.join(root, 'b.txt'), 'b', 'utf-8');
    await fs.writeFile(path.join(root, 'a.txt'), 'a', 'utf-8');

    const tree = await getFileTree(root);

    expect(tree.map((n) => n.name)).toEqual(['a-dir', 'b-dir', 'a.txt', 'b.txt']);
    expect(tree[0].isDirectory).toBe(true);
    expect(tree[2].isDirectory).toBe(false);
  });

  it('getFileTree: 存在しないパスはエラーになる', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    await expect(getFileTree('Z:/__definitely_not_exist__')).rejects.toThrow(
      'error occured while get file tree'
    );
    spy.mockRestore();
  });

  it('readFile: ファイルを読み込める', async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'tnet-read-'));
    const filePath = path.join(root, 'x.txt');
    await fs.writeFile(filePath, 'hello', 'utf-8');

    await expect(readFile(filePath)).resolves.toBe('hello');
  });

  it('createFile: 必要なディレクトリを作ってテンプレートを書き込む', async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'tnet-create-'));
    const filePath = path.join(root, 'nested', 'new.md');

    await createFile(filePath);

    const content = await fs.readFile(filePath, 'utf-8');
    expect(content).toContain('<keyword name="">');
    expect(content).toContain('### 変数・条件');
    expect(content).toContain('<details>');
  });

  it('createFile: 既存ファイルがある場合は失敗する', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'tnet-create-exists-'));
    const filePath = path.join(root, 'exists.md');
    await fs.writeFile(filePath, 'already', 'utf-8');

    await expect(createFile(filePath)).rejects.toThrow('error writing file');
    spy.mockRestore();
  });

  it('createDirectory: ネストしたディレクトリを作成できる', async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'tnet-mkdir-'));
    const dirPath = path.join(root, 'a', 'b', 'c');

    await createDirectory(dirPath);

    const stat = await fs.stat(dirPath);
    expect(stat.isDirectory()).toBe(true);
  });

  it('createDirectory: 既存ディレクトリがある場合は失敗する', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'tnet-mkdir-exists-'));
    const dirPath = path.join(root, 'dir');
    await fs.mkdir(dirPath);

    await expect(createDirectory(dirPath)).rejects.toThrow('error creating directory');
    spy.mockRestore();
  });

  it('saveSession/loadSession: セッションを保存・復元できる', async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'tnet-session-'));
    const filePaths = [path.join(root, 'a.md'), path.join(root, 'b.md')];

    await saveSession(root, filePaths);
    await expect(loadSession(root)).resolves.toEqual(filePaths);
  });

  it("loadSession: rootDirが''のとき空配列", async () => {
    await expect(loadSession('')).resolves.toEqual([]);
  });

  it('writeFile: keywords.jsonに<keyword name="...">を抽出して保存する（上書きで古いキーも消える）', async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'tnet-keywords-'));
    const settingsDir = path.join(root, '.tnet');
    await fs.mkdir(settingsDir, { recursive: true });
    await fs.writeFile(path.join(settingsDir, 'keywords.json'), JSON.stringify({}), 'utf-8');

    const target = path.join(root, 'doc.md');

    const content1 = '<keyword name="K1">x</keyword>\n<keyword name="K2">y</keyword>';
    await writeFile(target, content1, root);

    const keywords1 = (await readJson(path.join(settingsDir, 'keywords.json'))) as Record<
      string,
      string
    >;
    expect(keywords1).toMatchObject({
      K1: target,
      K2: target
    });

    const content2 = '<keyword name="K2">y</keyword>\n<keyword name="K3">z</keyword>';
    await writeFile(target, content2, root);

    const keywords2 = (await readJson(path.join(settingsDir, 'keywords.json'))) as Record<
      string,
      string
    >;
    expect(keywords2).toMatchObject({
      K2: target,
      K3: target
    });
    expect(keywords2.K1).toBeUndefined();
  });

  it('writeFile: keywords.jsonが無い初回でも動作する', async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'tnet-keywords-init-'));
    const target = path.join(root, 'doc.md');

    await writeFile(target, '<keyword name="K1">x</keyword>', root);

    const keywords = (await readJson(path.join(root, '.tnet', 'keywords.json'))) as Record<
      string,
      string
    >;
    expect(keywords).toMatchObject({ K1: target });
  });

  it('deleteFile: ファイルを削除し、session/keywordsからも除去する', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'tnet-delete-'));

    const target = path.join(root, 'a.md');
    await fs.writeFile(target, '<keyword name="K1">x</keyword>', 'utf-8');
    await writeFile(target, '<keyword name="K1">x</keyword>', root);

    await saveSession(root, [target]);

    await deleteFile(target, root);

    await expect(fs.access(target)).rejects.toBeDefined();

    await expect(loadSession(root)).resolves.toEqual([]);
    const keywords = (await readJson(path.join(root, '.tnet', 'keywords.json'))) as Record<
      string,
      string
    >;
    expect(keywords.K1).toBeUndefined();
    spy.mockRestore();
  });

  it('renamePath: パスを変更し、session/keywordsの参照も更新する', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'tnet-rename-'));

    const oldPath = path.join(root, 'old.md');
    const newPath = path.join(root, 'new.md');

    await writeFile(oldPath, '<keyword name="K1">x</keyword>', root);
    await saveSession(root, [oldPath]);

    await renamePath(oldPath, newPath, root);

    await expect(fs.access(oldPath)).rejects.toBeDefined();
    await expect(fs.access(newPath)).resolves.toBeUndefined();

    await expect(loadSession(root)).resolves.toEqual([newPath]);
    const keywords = (await readJson(path.join(root, '.tnet', 'keywords.json'))) as Record<
      string,
      string
    >;
    expect(keywords).toMatchObject({ K1: newPath });
    spy.mockRestore();
  });
});
