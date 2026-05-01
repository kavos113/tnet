import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
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
          list: listHistory
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
  });

  afterEach(() => {
    cleanup();
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
});
