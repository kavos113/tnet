import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { configureStore, type EnhancedStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { defaultRequesterWorkspaceSettings } from '@tnet/app-requester/shared/config';
import type { RequesterRequestDetail } from '@tnet/app-requester/shared/requesterTypes';
import { RequesterApp } from './RequesterApp';
import requesterReducer, { restoreRequester, setActiveRequesterRequest } from './requesterSlice';

const saveRequest = vi.fn();
const listRequests = vi.fn();
const sendRequest = vi.fn();
const listHistory = vi.fn();
const getHistory = vi.fn();

interface RequesterTestState {
  requester: ReturnType<typeof requesterReducer>;
}

const createStore = (): EnhancedStore<RequesterTestState> =>
  configureStore({
    reducer: {
      requester: requesterReducer
    }
  });

const activeRequest: RequesterRequestDetail = {
  id: 'request-1',
  workspaceId: 'workspace-1',
  name: 'Health',
  requestPath: 'Health.req',
  method: 'GET',
  url: 'https://example.test/health',
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
  authApiKeyValue: ''
};

const installTnetApi = (): void => {
  Object.defineProperty(window, 'tnet', {
    value: {
      requester: {
        requests: {
          save: saveRequest,
          list: listRequests
        },
        execution: {
          send: sendRequest
        },
        history: {
          list: listHistory,
          get: getHistory
        }
      }
    },
    writable: true
  });
};

describe('RequesterApp', () => {
  beforeEach(() => {
    installTnetApi();
    saveRequest.mockImplementation(async (request) => ({ ...activeRequest, ...request }));
    listRequests.mockResolvedValue([{ ...activeRequest }]);
    sendRequest.mockResolvedValue({
      response: {
        status: 200,
        statusText: 'OK',
        headers: [],
        bodyText: '{"ok":true}',
        bodyBase64: 'eyJvayI6dHJ1ZX0=',
        contentType: 'application/json',
        byteSize: 11,
        durationMs: 12,
        isBodyTruncated: false,
        previewType: 'json'
      }
    });
    listHistory.mockResolvedValue([]);
    getHistory.mockResolvedValue(null);
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('persists the edited endpoint and request body before sending', async () => {
    const store = createStore();
    store.dispatch(
      restoreRequester({
        activeWorkspaceId: 'workspace-1',
        workspaces: [{ id: 'workspace-1', name: 'Local' }],
        requests: [activeRequest],
        settings: defaultRequesterWorkspaceSettings()
      })
    );
    store.dispatch(setActiveRequesterRequest(activeRequest));

    render(
      <Provider store={store}>
        <RequesterApp />
      </Provider>
    );

    fireEvent.change(screen.getByLabelText('HTTP method'), { target: { value: 'POST' } });
    fireEvent.change(screen.getByLabelText('Request URL'), {
      target: { value: 'https://example.test/users' }
    });
    fireEvent.change(screen.getByLabelText('Body mode'), { target: { value: 'text' } });
    fireEvent.change(screen.getByLabelText('Request body'), {
      target: { value: '{"name":"Ada"}' }
    });
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));

    await waitFor(() =>
      expect(saveRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'request-1',
          workspaceId: 'workspace-1',
          method: 'POST',
          url: 'https://example.test/users',
          bodyMode: 'text',
          bodyText: '{"name":"Ada"}'
        })
      )
    );
    expect(sendRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'request-1',
        method: 'POST',
        url: 'https://example.test/users',
        bodyMode: 'text',
        bodyText: '{"name":"Ada"}',
        timeoutMs: defaultRequesterWorkspaceSettings().requestTimeoutMs
      })
    );
  });

  it('loads only the active request history and shows a historical response when clicked', async () => {
    const store = createStore();
    store.dispatch(
      restoreRequester({
        activeWorkspaceId: 'workspace-1',
        workspaces: [{ id: 'workspace-1', name: 'Local' }],
        requests: [activeRequest],
        settings: defaultRequesterWorkspaceSettings()
      })
    );
    store.dispatch(setActiveRequesterRequest(activeRequest));
    listHistory.mockResolvedValue([
      {
        id: 'history-1',
        workspaceId: 'workspace-1',
        requestId: 'request-1',
        requestName: 'Health',
        method: 'GET',
        url: 'https://example.test/health',
        startedAt: '2026-05-01T00:00:00.000Z',
        durationMs: 24,
        status: 201
      }
    ]);
    getHistory.mockResolvedValue({
      id: 'history-1',
      workspaceId: 'workspace-1',
      requestId: 'request-1',
      requestName: 'Health',
      method: 'GET',
      url: 'https://example.test/health',
      startedAt: '2026-05-01T00:00:00.000Z',
      durationMs: 24,
      status: 201,
      requestSnapshot: activeRequest,
      responseSnapshot: {
        status: 201,
        statusText: 'Created',
        headers: [
          {
            id: 'content-type',
            enabled: true,
            key: 'content-type',
            value: 'application/json'
          }
        ],
        bodyText: '{"created":true}',
        bodyBase64: 'eyJjcmVhdGVkIjp0cnVlfQ==',
        contentType: 'application/json',
        byteSize: 16,
        durationMs: 24,
        isBodyTruncated: false,
        previewType: 'json'
      }
    });

    render(
      <Provider store={store}>
        <RequesterApp />
      </Provider>
    );

    await waitFor(() =>
      expect(listHistory).toHaveBeenCalledWith({
        workspaceId: 'workspace-1',
        requestId: 'request-1'
      })
    );

    const historyStatus = await screen.findByText('201');
    fireEvent.click(historyStatus.closest('button') ?? historyStatus);

    await waitFor(() => expect(getHistory).toHaveBeenCalledWith({ historyId: 'history-1' }));
    expect(screen.getByText('201 Created')).toBeInTheDocument();
    expect(screen.getByText('{"created":true}')).toBeInTheDocument();
    expect(screen.getByText('content-type')).toBeInTheDocument();
  });

  it('debounces request name autosave and applies requester font settings', async () => {
    vi.useFakeTimers();
    const store = createStore();
    store.dispatch(
      restoreRequester({
        activeWorkspaceId: 'workspace-1',
        workspaces: [{ id: 'workspace-1', name: 'Local' }],
        requests: [activeRequest],
        settings: {
          ...defaultRequesterWorkspaceSettings(),
          codeFontFamily: 'Code Font',
          codeFontSize: 15,
          appFontFamily: 'UI Font',
          appFontSize: 14
        }
      })
    );
    store.dispatch(setActiveRequesterRequest(activeRequest));

    render(
      <Provider store={store}>
        <RequesterApp />
      </Provider>
    );

    expect(screen.getByRole('main', { name: 'Requester' })).toHaveStyle({
      '--requester-code-font-family': 'Code Font',
      '--requester-code-font-size': '15px',
      '--requester-app-font-family': 'UI Font',
      '--requester-app-font-size': '14px'
    });

    fireEvent.change(screen.getByLabelText('Request name'), {
      target: { value: 'Create User' }
    });

    act(() => {
      vi.advanceTimersByTime(599);
    });
    expect(saveRequest).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1);
    });

    expect(saveRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'request-1',
        name: 'Create User'
      })
    );
  });
});
