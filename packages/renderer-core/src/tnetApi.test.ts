import { afterEach, describe, expect, it, vi } from 'vitest';
import { getTnetApi, tnetApi } from './tnetApi';

const setWindowTnet = (api: unknown): void => {
  Object.defineProperty(window, 'tnet', {
    value: api,
    configurable: true
  });
};

describe('tnetApi', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    Reflect.deleteProperty(window, 'tnet');
  });

  it('returns window.tnet when available', () => {
    const api = { workspace: { openDirectory: vi.fn() } };
    setWindowTnet(api);

    expect(getTnetApi()).toBe(api);
  });

  it('throws when window.tnet is missing', () => {
    Reflect.deleteProperty(window, 'tnet');

    expect(() => getTnetApi()).toThrow(/window\.tnet/);
  });

  it('forwards workspace, file, session, and config calls', async () => {
    const api = {
      workspace: {
        openDirectory: vi.fn().mockResolvedValue('root'),
        getFileTree: vi.fn().mockResolvedValue([])
      },
      file: {
        read: vi.fn().mockResolvedValue({ content: 'text' }),
        openWithDefaultApp: vi.fn().mockResolvedValue(undefined),
        createDirectory: vi.fn().mockResolvedValue(undefined)
      },
      session: {
        load: vi.fn().mockResolvedValue({ activeFilePath: 'a.md', openFilePaths: [] }),
        save: vi.fn().mockResolvedValue(undefined)
      },
      config: {
        loadGlobal: vi.fn().mockResolvedValue({}),
        saveGlobal: vi.fn().mockResolvedValue(undefined)
      }
    };
    setWindowTnet(api);

    await expect(tnetApi.workspace.openDirectory()).resolves.toBe('root');
    await tnetApi.workspace.getFileTree('root');
    await tnetApi.file.read({ rootDir: 'root', path: 'a.md' });
    await tnetApi.file.openWithDefaultApp({ rootDir: 'root', path: 'a.md' });
    await tnetApi.file.createDirectory({ rootDir: 'root', path: 'notes' });
    await tnetApi.session.load('root');
    await tnetApi.session.save('root', { activeFilePath: 'a.md', openFilePaths: [] });
    await tnetApi.config.loadGlobal();
    await tnetApi.config.saveGlobal({});

    expect(api.workspace.getFileTree).toHaveBeenCalledWith('root');
    expect(api.file.read).toHaveBeenCalledWith({ rootDir: 'root', path: 'a.md' });
    expect(api.file.createDirectory).toHaveBeenCalledWith({ rootDir: 'root', path: 'notes' });
    expect(api.session.save).toHaveBeenCalledWith('root', {
      activeFilePath: 'a.md',
      openFilePaths: []
    });
  });
});
