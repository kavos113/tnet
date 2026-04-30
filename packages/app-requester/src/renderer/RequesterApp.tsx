import { useEffect, useState } from 'react';
import type {
  RequesterBodyMode,
  RequesterHttpMethod,
  RequesterKeyValueRow
} from '@tnet/app-requester/shared/requesterTypes';
import {
  setActiveRequesterRequest,
  setRequesterError,
  setRequesterRequests
} from './requesterSlice';
import { requesterTnetApi } from './requesterTnetApi';
import { useRequesterDispatch, useRequesterSelector } from './storeHooks';

const httpMethods: RequesterHttpMethod[] = [
  'GET',
  'POST',
  'PUT',
  'PATCH',
  'DELETE',
  'HEAD',
  'OPTIONS'
];
const bodyModes: RequesterBodyMode[] = ['none', 'json', 'text', 'form-url-encoded', 'graphql'];

const createEmptyRow = (): RequesterKeyValueRow => ({
  id: crypto.randomUUID(),
  enabled: true,
  key: '',
  value: ''
});

export const RequesterApp = (): React.JSX.Element => {
  const dispatch = useRequesterDispatch();
  const activeRequest = useRequesterSelector((state) => state.requester.activeRequest);
  const activeWorkspaceId = useRequesterSelector((state) => state.requester.activeWorkspaceId);
  const error = useRequesterSelector((state) => state.requester.error);
  const isRestored = useRequesterSelector((state) => state.requester.isRestored);
  const [name, setName] = useState('');
  const [method, setMethod] = useState<RequesterHttpMethod>('GET');
  const [url, setUrl] = useState('');
  const [headers, setHeaders] = useState<RequesterKeyValueRow[]>([]);
  const [queryParams, setQueryParams] = useState<RequesterKeyValueRow[]>([]);
  const [bodyMode, setBodyMode] = useState<RequesterBodyMode>('none');
  const [bodyText, setBodyText] = useState('');

  useEffect(() => {
    setName(activeRequest?.name ?? '');
    setMethod(activeRequest?.method ?? 'GET');
    setUrl(activeRequest?.url ?? '');
    setHeaders(activeRequest?.headers ?? []);
    setQueryParams(activeRequest?.queryParams ?? []);
    setBodyMode(activeRequest?.bodyMode ?? 'none');
    setBodyText(activeRequest?.bodyText ?? '');
  }, [activeRequest]);

  const saveRequest = async (): Promise<void> => {
    if (!activeWorkspaceId) return;
    const saved = await requesterTnetApi.requester.requests.save({
      id: activeRequest?.id,
      workspaceId: activeWorkspaceId,
      name: name.trim() || 'Untitled Request',
      method,
      url,
      bodyMode,
      bodyText,
      headers,
      queryParams
    });
    const requests = await requesterTnetApi.requester.requests.list({
      workspaceId: activeWorkspaceId
    });
    dispatch(setActiveRequesterRequest(saved));
    dispatch(setRequesterRequests(requests));
  };

  const runSave = (): void => {
    saveRequest().catch((error: unknown) => {
      console.error('Failed to save request', error);
      dispatch(setRequesterError('Failed to save request.'));
    });
  };

  const updateRow = (
    rows: RequesterKeyValueRow[],
    rowId: string,
    patch: Partial<RequesterKeyValueRow>
  ): RequesterKeyValueRow[] => rows.map((row) => (row.id === rowId ? { ...row, ...patch } : row));

  const renderKeyValueTable = (
    label: string,
    rows: RequesterKeyValueRow[],
    setRows: (rows: RequesterKeyValueRow[]) => void
  ): React.JSX.Element => (
    <section className="requester-kv-section" aria-label={label}>
      <header>
        <h2>{label}</h2>
        <button
          type="button"
          className="open-folder-button"
          onClick={() => setRows([...rows, createEmptyRow()])}
        >
          Add
        </button>
      </header>
      <div className="requester-kv-table">
        {rows.map((row) => (
          <div className="requester-kv-row" key={row.id}>
            <input
              type="checkbox"
              aria-label={`${label} enabled`}
              checked={row.enabled}
              onChange={(event) =>
                setRows(updateRow(rows, row.id, { enabled: event.target.checked }))
              }
            />
            <input
              aria-label={`${label} key`}
              placeholder="Key"
              value={row.key}
              onChange={(event) => setRows(updateRow(rows, row.id, { key: event.target.value }))}
            />
            <input
              aria-label={`${label} value`}
              placeholder="Value"
              value={row.value}
              onChange={(event) => setRows(updateRow(rows, row.id, { value: event.target.value }))}
            />
            <button
              type="button"
              className="sidebar-icon-button material-icons-round"
              aria-label={`Remove ${label} row`}
              onClick={() => setRows(rows.filter((item) => item.id !== row.id))}
            >
              close
            </button>
          </div>
        ))}
        {rows.length === 0 ? <p className="empty-list-message">No rows.</p> : null}
      </div>
    </section>
  );

  if (!isRestored) {
    return (
      <main className="placeholder-app" aria-label="Requester">
        <section className="placeholder-app-content">
          <span className="material-icons-round placeholder-app-icon" aria-hidden="true">
            api
          </span>
          <h1>Requester</h1>
          <p>Restoring request workspaces...</p>
        </section>
      </main>
    );
  }

  if (!activeWorkspaceId) {
    return (
      <main className="placeholder-app" aria-label="Requester">
        <section className="placeholder-app-content">
          <span className="material-icons-round placeholder-app-icon" aria-hidden="true">
            api
          </span>
          <h1>Requester</h1>
          <p>Create a request workspace to begin.</p>
        </section>
      </main>
    );
  }

  if (!activeRequest) {
    return (
      <main className="placeholder-app" aria-label="Requester">
        <section className="placeholder-app-content">
          <span className="material-icons-round placeholder-app-icon" aria-hidden="true">
            article
          </span>
          <h1>No request selected</h1>
          <p>Create or select a request from the sidebar.</p>
        </section>
      </main>
    );
  }

  return (
    <main className="requester-app" aria-label="Requester">
      <section className="requester-editor" aria-label="API request editor">
        <header className="requester-editor-header">
          <input
            className="requester-name-input"
            aria-label="Request name"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          <button type="button" className="open-folder-button" onClick={runSave}>
            Save
          </button>
        </header>
        <div className="requester-url-row">
          <select
            aria-label="HTTP method"
            value={method}
            onChange={(event) => setMethod(event.target.value as RequesterHttpMethod)}
          >
            {httpMethods.map((method) => (
              <option key={method} value={method}>
                {method}
              </option>
            ))}
          </select>
          <input
            aria-label="Request URL"
            placeholder="https://api.example.test"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
          />
          <button type="button" className="open-folder-button" disabled>
            Send
          </button>
        </div>
        <section className="requester-body-editor">
          <div className="requester-kv-grid">
            {renderKeyValueTable('Query Params', queryParams, setQueryParams)}
            {renderKeyValueTable('Headers', headers, setHeaders)}
          </div>
          <label>
            Body
            <select
              aria-label="Body mode"
              value={bodyMode}
              onChange={(event) => setBodyMode(event.target.value as RequesterBodyMode)}
            >
              {bodyModes.map((mode) => (
                <option key={mode} value={mode}>
                  {mode}
                </option>
              ))}
            </select>
          </label>
          <textarea
            aria-label="Request body"
            value={bodyText}
            disabled={bodyMode === 'none'}
            onChange={(event) => setBodyText(event.target.value)}
          />
        </section>
        {error ? <p className="requester-error">{error}</p> : null}
      </section>
      <section className="requester-response-placeholder" aria-label="API response">
        <h2>Response</h2>
        <p>HTTP execution will be wired in the next implementation step.</p>
      </section>
    </main>
  );
};
