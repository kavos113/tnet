import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Provider } from 'react-redux';
import { App } from './App';
import { createAppStore } from './app/store';

describe('App', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'tnet', {
      value: {
        workspace: {
          openDirectory: vi.fn(),
          getFileTree: vi.fn().mockResolvedValue([])
        },
        file: {
          read: vi.fn(),
          write: vi.fn(),
          create: vi.fn(),
          createDirectory: vi.fn(),
          delete: vi.fn(),
          rename: vi.fn()
        },
        session: {
          load: vi.fn(),
          save: vi.fn()
        },
        config: {
          loadGlobal: vi.fn().mockResolvedValue({}),
          saveGlobal: vi.fn(),
          loadProject: vi.fn(),
          saveProject: vi.fn()
        },
        keyword: {
          loadIndex: vi.fn(),
          getContent: vi.fn()
        }
      },
      writable: true
    });
  });

  it('renders the React shell', async () => {
    render(
      <Provider store={createAppStore()}>
        <App />
      </Provider>
    );

    expect(await screen.findByText('Files')).toBeInTheDocument();
    expect(screen.getByText('Open Folder')).toBeInTheDocument();
    expect(screen.getByText('No file selected')).toBeInTheDocument();
  });
});
