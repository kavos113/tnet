import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  installExtension: vi.fn(),
  is: { dev: true },
  session: { defaultSession: { id: 'default-session' } },
  reactDevtools: { id: 'react-devtools' },
  reduxDevtools: { id: 'redux-devtools' }
}));

vi.mock('electron', () => ({
  session: mocks.session
}));

vi.mock('@electron-toolkit/utils', () => ({
  is: mocks.is
}));

vi.mock('electron-devtools-installer', () => ({
  default: mocks.installExtension,
  REACT_DEVELOPER_TOOLS: mocks.reactDevtools,
  REDUX_DEVTOOLS: mocks.reduxDevtools
}));

describe('installDevtools', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    mocks.is.dev = true;
    mocks.installExtension.mockResolvedValue([{ name: 'React' }, { name: 'Redux' }]);
    vi.spyOn(console, 'info').mockImplementation(() => undefined);
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  it('installs React and Redux DevTools in development', async () => {
    const { installDevtools } = await import('./installDevtools');

    await installDevtools();

    expect(mocks.installExtension).toHaveBeenCalledWith(
      [mocks.reactDevtools, mocks.reduxDevtools],
      {
        session: mocks.session.defaultSession,
        loadExtensionOptions: {
          allowFileAccess: true
        }
      }
    );
  });

  it('skips installing extensions outside development', async () => {
    mocks.is.dev = false;
    const { installDevtools } = await import('./installDevtools');

    await installDevtools();

    expect(mocks.installExtension).not.toHaveBeenCalled();
  });

  it('does not throw when extension installation fails', async () => {
    mocks.installExtension.mockRejectedValue(new Error('install failed'));
    const { installDevtools } = await import('./installDevtools');

    await expect(installDevtools()).resolves.toBeUndefined();
    expect(console.warn).toHaveBeenCalledWith(
      'Failed to install Electron DevTools extensions',
      expect.any(Error)
    );
  });
});
