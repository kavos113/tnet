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
const getSettings = vi.fn();
const saveSettings = vi.fn();
const saveGlobalConfig = vi.fn();
const listHistory = vi.fn();

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
          save: saveRequest
        },
        history: {
          list: listHistory
        }
      }
    },
    writable: true
  });
};

describe('RequesterSidebar', () => {
  beforeEach(() => {
    installTnetApi();
    listWorkspaces.mockResolvedValue([{ id: 'workspace-1', name: 'Local' }]);
    createWorkspace.mockResolvedValue({ id: 'workspace-2', name: 'Workspace 2' });
    getSettings.mockResolvedValue(defaultRequesterWorkspaceSettings());
    saveSettings.mockResolvedValue(undefined);
    saveGlobalConfig.mockResolvedValue(undefined);
    listRequests.mockResolvedValue([requestSummary()]);
    getRequest.mockResolvedValue(requestDetail());
    saveRequest.mockImplementation(async (request) => requestDetail(request));
    listHistory.mockResolvedValue([]);
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
});
