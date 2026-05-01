import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { configureStore, type EnhancedStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { defaultRequesterWorkspaceSettings } from '@tnet/app-requester/shared/config';
import type {
  RequesterRequestDetail,
  RequesterRequestSummary
} from '@tnet/app-requester/shared/requesterTypes';
import { RequesterSidebar } from './RequesterSidebar';
import requesterReducer, { restoreRequester, setActiveRequesterFolder } from './requesterSlice';

const listWorkspaces = vi.fn();
const createWorkspace = vi.fn();
const listRequests = vi.fn();
const getRequest = vi.fn();
const saveRequest = vi.fn();
const removeRequest = vi.fn();
const getSettings = vi.fn();
const saveSettings = vi.fn();
const saveGlobalConfig = vi.fn();
const listHistory = vi.fn();
const sendRequest = vi.fn();

interface RequesterTestState {
  requester: ReturnType<typeof requesterReducer>;
}

const createStore = (): EnhancedStore<RequesterTestState> =>
  configureStore({
    reducer: {
      requester: requesterReducer
    }
  });

const requestSummary = (
  overrides: Partial<RequesterRequestSummary> = {}
): RequesterRequestSummary => ({
  id: 'request-1',
  workspaceId: 'workspace-1',
  name: 'List users',
  requestPath: 'accounts/list.http',
  method: 'GET',
  url: 'https://example.test/users',
  ...overrides
});

const requestDetail = (
  overrides: Partial<RequesterRequestDetail> = {}
): RequesterRequestDetail => ({
  ...requestSummary(overrides),
  headers: [],
  queryParams: [],
  bodyMode: 'none',
  bodyText: '',
  binaryFilePath: '',
  graphqlVariablesText: '',
  graphqlOperationName: '',
  authType: 'none',
  authUsername: '',
  authPassword: '',
  authToken: '',
  authApiKeyName: '',
  authApiKeyValue: '',
  extractionRules: [],
  ...overrides
});

const installTnetApi = (): void => {
  Object.defineProperty(window, 'tnet', {
    value: {
      requester: {
        config: {
          saveGlobal: saveGlobalConfig
        },
        workspaces: {
          list: listWorkspaces,
          create: createWorkspace,
          getSettings,
          saveSettings
        },
        requests: {
          list: listRequests,
          get: getRequest,
          save: saveRequest,
          remove: removeRequest
        },
        history: {
          list: listHistory
        },
        execution: {
          send: sendRequest
        }
      }
    },
    writable: true
  });
};

describe('RequesterSidebar', () => {
  beforeEach(() => {
    installTnetApi();
    Object.defineProperty(window, 'confirm', {
      value: vi.fn(() => true),
      writable: true
    });
    listWorkspaces.mockResolvedValue([{ id: 'workspace-1', name: 'Local' }]);
    createWorkspace.mockResolvedValue({ id: 'workspace-2', name: 'Workspace 2' });
    getSettings.mockResolvedValue(defaultRequesterWorkspaceSettings());
    saveSettings.mockResolvedValue(undefined);
    saveGlobalConfig.mockResolvedValue(undefined);
    listRequests.mockResolvedValue([requestSummary()]);
    getRequest.mockResolvedValue(requestDetail());
    saveRequest.mockImplementation(async (request) => requestDetail(request));
    removeRequest.mockResolvedValue(undefined);
    listHistory.mockResolvedValue([]);
    sendRequest.mockResolvedValue({
      response: {
        status: 200,
        statusText: 'OK',
        headers: [],
        bodyText: 'ok',
        bodyBase64: '',
        contentType: 'text/plain',
        byteSize: 2,
        durationMs: 10,
        isBodyTruncated: false,
        previewType: 'text'
      }
    });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('renders requests as a persisted tree and saves folder expansion by workspace', async () => {
    const store = createStore();
    store.dispatch(
      restoreRequester({
        activeWorkspaceId: 'workspace-1',
        workspaces: [{ id: 'workspace-1', name: 'Local' }],
        requests: [
          requestSummary(),
          requestSummary({
            id: 'request-2',
            name: 'Root',
            requestPath: 'root.http'
          })
        ],
        settings: {
          ...defaultRequesterWorkspaceSettings(),
          expandedRequestPaths: ['accounts']
        }
      })
    );

    render(
      <Provider store={store}>
        <RequesterSidebar />
      </Provider>
    );

    expect(screen.getByText('accounts')).toBeInTheDocument();
    expect(screen.getByText('list.http')).toBeInTheDocument();
    expect(screen.getByText('root.http')).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('Collapse accounts'));

    await waitFor(() =>
      expect(saveSettings).toHaveBeenCalledWith({
        workspaceId: 'workspace-1',
        settings: expect.objectContaining({
          expandedRequestPaths: []
        })
      })
    );
  });

  it('creates a new request under the active folder with an .http path', async () => {
    const store = createStore();
    store.dispatch(
      restoreRequester({
        activeWorkspaceId: 'workspace-1',
        workspaces: [{ id: 'workspace-1', name: 'Local' }],
        requests: [requestSummary()],
        settings: defaultRequesterWorkspaceSettings()
      })
    );
    store.dispatch(setActiveRequesterFolder('accounts'));

    render(
      <Provider store={store}>
        <RequesterSidebar />
      </Provider>
    );

    fireEvent.click(screen.getByLabelText('Create request'));

    await waitFor(() =>
      expect(saveRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          workspaceId: 'workspace-1',
          name: 'Request 2',
          requestPath: 'accounts/Request 2.http'
        })
      )
    );
  });

  it('creates a new request with Ctrl+N', async () => {
    const store = createStore();
    store.dispatch(
      restoreRequester({
        activeWorkspaceId: 'workspace-1',
        workspaces: [{ id: 'workspace-1', name: 'Local' }],
        requests: [],
        settings: defaultRequesterWorkspaceSettings()
      })
    );

    render(
      <Provider store={store}>
        <RequesterSidebar />
      </Provider>
    );

    fireEvent.keyDown(window, { key: 'n', ctrlKey: true });

    await waitFor(() =>
      expect(saveRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          workspaceId: 'workspace-1',
          name: 'Request 1',
          requestPath: 'Request 1.http'
        })
      )
    );
  });

  it('creates a root requester folder with Ctrl+Shift+N', async () => {
    const store = createStore();
    store.dispatch(
      restoreRequester({
        activeWorkspaceId: 'workspace-1',
        workspaces: [{ id: 'workspace-1', name: 'Local' }],
        requests: [],
        settings: defaultRequesterWorkspaceSettings()
      })
    );

    render(
      <Provider store={store}>
        <RequesterSidebar />
      </Provider>
    );

    fireEvent.keyDown(window, { key: 'N', ctrlKey: true, shiftKey: true });
    const input = screen.getByDisplayValue('New Folder');
    fireEvent.change(input, { target: { value: 'admin' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    await waitFor(() =>
      expect(saveSettings).toHaveBeenCalledWith({
        workspaceId: 'workspace-1',
        settings: expect.objectContaining({
          requestFolderPaths: ['admin'],
          expandedRequestPaths: ['admin']
        })
      })
    );
    expect(store.getState().requester.activeRequestFolderPath).toBe('admin');
    expect(screen.getByText('admin')).toBeInTheDocument();
  });

  it('creates a requester folder under the selected folder with Ctrl+Shift+N', async () => {
    const store = createStore();
    store.dispatch(
      restoreRequester({
        activeWorkspaceId: 'workspace-1',
        workspaces: [{ id: 'workspace-1', name: 'Local' }],
        requests: [],
        settings: {
          ...defaultRequesterWorkspaceSettings(),
          requestFolderPaths: ['admin'],
          expandedRequestPaths: ['admin']
        }
      })
    );

    render(
      <Provider store={store}>
        <RequesterSidebar />
      </Provider>
    );

    fireEvent.click(screen.getByText('admin'));
    fireEvent.keyDown(window, { key: 'N', ctrlKey: true, shiftKey: true });
    const input = screen.getByDisplayValue('New Folder');
    fireEvent.change(input, { target: { value: 'users' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    await waitFor(() =>
      expect(saveSettings).toHaveBeenCalledWith({
        workspaceId: 'workspace-1',
        settings: expect.objectContaining({
          requestFolderPaths: ['admin', 'admin/users'],
          expandedRequestPaths: ['admin', 'admin/users']
        })
      })
    );
    expect(store.getState().requester.activeRequestFolderPath).toBe('admin/users');
  });

  it('deletes the selected request with Delete', async () => {
    const store = createStore();
    store.dispatch(
      restoreRequester({
        activeWorkspaceId: 'workspace-1',
        workspaces: [{ id: 'workspace-1', name: 'Local' }],
        requests: [requestSummary()],
        settings: {
          ...defaultRequesterWorkspaceSettings(),
          expandedRequestPaths: ['accounts']
        }
      })
    );
    listRequests.mockResolvedValue([]);

    render(
      <Provider store={store}>
        <RequesterSidebar />
      </Provider>
    );

    fireEvent.click(screen.getByText('list.http'));
    await waitFor(() => expect(getRequest).toHaveBeenCalledWith({ requestId: 'request-1' }));

    fireEvent.keyDown(window, { key: 'Delete' });

    await waitFor(() => expect(removeRequest).toHaveBeenCalledWith({ requestId: 'request-1' }));
    expect(store.getState().requester.activeRequestId).toBeUndefined();
    expect(store.getState().requester.requests).toEqual([]);
  });

  it('renames and moves a request from the request path dialog', async () => {
    const store = createStore();
    store.dispatch(
      restoreRequester({
        activeWorkspaceId: 'workspace-1',
        workspaces: [{ id: 'workspace-1', name: 'Local' }],
        requests: [requestSummary()],
        settings: {
          ...defaultRequesterWorkspaceSettings(),
          expandedRequestPaths: ['accounts']
        }
      })
    );
    getRequest.mockResolvedValue(requestDetail());
    saveRequest.mockResolvedValue(
      requestDetail({
        name: 'Create user',
        requestPath: 'admin/users/Create user.http'
      })
    );
    listRequests.mockResolvedValue([
      requestSummary({
        name: 'Create user',
        requestPath: 'admin/users/Create user.http'
      })
    ]);

    render(
      <Provider store={store}>
        <RequesterSidebar />
      </Provider>
    );

    fireEvent.click(screen.getByLabelText('Rename list.http'));
    fireEvent.change(screen.getByLabelText('Request name'), {
      target: { value: 'Create user' }
    });
    fireEvent.change(screen.getByLabelText('Folder path'), {
      target: { value: 'admin/users' }
    });

    expect(screen.getByLabelText('Request path preview')).toHaveTextContent(
      'admin/users/Create user.http'
    );

    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() =>
      expect(saveRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'request-1',
          name: 'Create user',
          requestPath: 'admin/users/Create user.http'
        })
      )
    );
    expect(saveSettings).toHaveBeenCalledWith({
      workspaceId: 'workspace-1',
      settings: expect.objectContaining({
        expandedRequestPaths: ['accounts', 'admin/users'],
        requestFolderPaths: ['admin/users']
      })
    });
    expect(store.getState().requester.activeRequestFolderPath).toBe('admin/users');
  });

  it('runs all workspace requests as an explicit sequence', async () => {
    const store = createStore();
    const first = requestSummary({ id: 'request-1', name: 'First', requestPath: 'First.http' });
    const second = requestSummary({ id: 'request-2', name: 'Second', requestPath: 'Second.http' });
    store.dispatch(
      restoreRequester({
        activeWorkspaceId: 'workspace-1',
        workspaces: [{ id: 'workspace-1', name: 'Local' }],
        requests: [first, second],
        settings: {
          ...defaultRequesterWorkspaceSettings(),
          defaultVariableSetId: 'variables-1'
        }
      })
    );
    getRequest.mockImplementation(async (request: { requestId: string }) =>
      requestDetail(request.requestId === 'request-2' ? second : first)
    );

    render(
      <Provider store={store}>
        <RequesterSidebar />
      </Provider>
    );

    fireEvent.click(screen.getByLabelText('Run sequence'));

    await waitFor(() => expect(sendRequest).toHaveBeenCalledTimes(2));
    expect(sendRequest).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        id: 'request-1',
        variableSetId: 'variables-1'
      })
    );
    expect(sendRequest).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        id: 'request-2',
        variableSetId: 'variables-1'
      })
    );
    expect(listHistory).toHaveBeenCalledWith({
      workspaceId: 'workspace-1',
      requestId: 'request-2'
    });
  });
});
