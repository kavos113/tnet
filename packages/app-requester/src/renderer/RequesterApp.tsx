import { useEffect, useRef, useState, type CSSProperties } from 'react';
import type {
  RequesterBodyMode,
  RequesterHttpMethod,
  RequesterKeyValueRow,
  RequesterRequestDetail,
  SaveRequesterRequestInput
} from '@tnet/app-requester/shared/requesterTypes';
import {
  setActiveRequesterRequest,
  setRequesterError,
  setRequesterHistory,
  setRequesterRequests,
  setRequesterResponse
} from './requesterSlice';
import { JsonTextEditor } from './request/JsonTextEditor';
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
const bodyModes: RequesterBodyMode[] = [
  'none',
  'json',
  'text',
  'form-url-encoded',
  'graphql',
  'binary-file'
];

const createEmptyRow = (): RequesterKeyValueRow => ({
  id: crypto.randomUUID(),
  enabled: true,
  key: '',
  value: ''
});

interface GraphqlSchemaTypeSummary {
  name: string;
  kind: string;
  fieldCount: number;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const buildGraphqlSchemaSummary = (schemaJson: string): GraphqlSchemaTypeSummary[] => {
  const parsed: unknown = JSON.parse(schemaJson);
  if (!isRecord(parsed) || !isRecord(parsed.data) || !isRecord(parsed.data.__schema)) {
    return [];
  }

  const types = parsed.data.__schema.types;
  if (!Array.isArray(types)) return [];

  return types
    .flatMap((type): GraphqlSchemaTypeSummary[] => {
      if (!isRecord(type) || typeof type.name !== 'string' || typeof type.kind !== 'string') {
        return [];
      }
      if (type.name.startsWith('__')) return [];

      const fields = Array.isArray(type.fields)
        ? type.fields
        : Array.isArray(type.inputFields)
          ? type.inputFields
          : Array.isArray(type.enumValues)
            ? type.enumValues
            : [];

      return [
        {
          name: type.name,
          kind: type.kind,
          fieldCount: fields.length
        }
      ];
    })
    .sort((left, right) => left.name.localeCompare(right.name))
    .slice(0, 48);
};

export const RequesterApp = (): React.JSX.Element => {
  const dispatch = useRequesterDispatch();
  const activeRequest = useRequesterSelector((state) => state.requester.activeRequest);
  const activeResponse = useRequesterSelector((state) => state.requester.activeResponse);
  const activeWorkspaceId = useRequesterSelector((state) => state.requester.activeWorkspaceId);
  const error = useRequesterSelector((state) => state.requester.error);
  const history = useRequesterSelector((state) => state.requester.history);
  const isRestored = useRequesterSelector((state) => state.requester.isRestored);
  const settings = useRequesterSelector((state) => state.requester.settings);
  const [name, setName] = useState('');
  const [method, setMethod] = useState<RequesterHttpMethod>('GET');
  const [url, setUrl] = useState('');
  const [headers, setHeaders] = useState<RequesterKeyValueRow[]>([]);
  const [queryParams, setQueryParams] = useState<RequesterKeyValueRow[]>([]);
  const [bodyMode, setBodyMode] = useState<RequesterBodyMode>('none');
  const [bodyText, setBodyText] = useState('');
  const [binaryFilePath, setBinaryFilePath] = useState('');
  const [graphqlVariablesText, setGraphqlVariablesText] = useState('');
  const [graphqlOperationName, setGraphqlOperationName] = useState('');
  const [authType, setAuthType] = useState(activeRequest?.authType ?? 'none');
  const [authUsername, setAuthUsername] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authToken, setAuthToken] = useState('');
  const [authApiKeyName, setAuthApiKeyName] = useState('');
  const [authApiKeyValue, setAuthApiKeyValue] = useState('');
  const [graphqlSchemaTypes, setGraphqlSchemaTypes] = useState<GraphqlSchemaTypeSummary[]>([]);
  const [selectedHistoryId, setSelectedHistoryId] = useState<string>();
  const nameAutosaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (nameAutosaveTimeoutRef.current) clearTimeout(nameAutosaveTimeoutRef.current);
    setName(activeRequest?.name ?? '');
    setMethod(activeRequest?.method ?? 'GET');
    setUrl(activeRequest?.url ?? '');
    setHeaders(activeRequest?.headers ?? []);
    setQueryParams(activeRequest?.queryParams ?? []);
    setBodyMode(activeRequest?.bodyMode ?? 'none');
    setBodyText(activeRequest?.bodyText ?? '');
    setBinaryFilePath(activeRequest?.binaryFilePath ?? '');
    setGraphqlVariablesText(activeRequest?.graphqlVariablesText ?? '');
    setGraphqlOperationName(activeRequest?.graphqlOperationName ?? '');
    setAuthType(activeRequest?.authType ?? 'none');
    setAuthUsername(activeRequest?.authUsername ?? '');
    setAuthPassword(activeRequest?.authPassword ?? '');
    setAuthToken(activeRequest?.authToken ?? '');
    setAuthApiKeyName(activeRequest?.authApiKeyName ?? '');
    setAuthApiKeyValue(activeRequest?.authApiKeyValue ?? '');
    setGraphqlSchemaTypes([]);
    setSelectedHistoryId(undefined);
  }, [activeRequest]);

  useEffect(
    () => () => {
      if (nameAutosaveTimeoutRef.current) clearTimeout(nameAutosaveTimeoutRef.current);
    },
    []
  );

  useEffect(() => {
    if (!activeWorkspaceId || !activeRequest?.id) {
      dispatch(setRequesterHistory([]));
      return;
    }

    let canceled = false;

    requesterTnetApi.requester.history
      .list({
        workspaceId: activeWorkspaceId,
        requestId: activeRequest.id
      })
      .then((history) => {
        if (!canceled) dispatch(setRequesterHistory(history));
      })
      .catch((error: unknown) => {
        console.error('Failed to load request history', error);
        if (!canceled) dispatch(setRequesterError('Failed to load request history.'));
      });

    return () => {
      canceled = true;
    };
  }, [activeRequest?.id, activeWorkspaceId, dispatch]);

  const buildRequestInput = (nameOverride?: string): SaveRequesterRequestInput | undefined => {
    if (!activeWorkspaceId) return undefined;

    return {
      id: activeRequest?.id,
      workspaceId: activeWorkspaceId,
      name: (nameOverride ?? name).trim() || 'Untitled Request',
      method,
      url,
      bodyMode,
      bodyText,
      binaryFilePath,
      graphqlVariablesText,
      graphqlOperationName,
      headers,
      queryParams,
      authType,
      authUsername,
      authPassword,
      authToken,
      authApiKeyName,
      authApiKeyValue
    };
  };

  const saveRequest = async (
    nameOverride?: string
  ): Promise<RequesterRequestDetail | undefined> => {
    const requestInput = buildRequestInput(nameOverride);
    if (!requestInput) return undefined;

    const saved = await requesterTnetApi.requester.requests.save(requestInput);
    const requests = await requesterTnetApi.requester.requests.list({
      workspaceId: requestInput.workspaceId
    });
    dispatch(setActiveRequesterRequest(saved));
    dispatch(setRequesterRequests(requests));

    return saved;
  };

  const runSave = (): void => {
    saveRequest().catch((error: unknown) => {
      console.error('Failed to save request', error);
      dispatch(setRequesterError('Failed to save request.'));
    });
  };

  const scheduleNameAutosave = (nextName: string): void => {
    setName(nextName);
    if (nameAutosaveTimeoutRef.current) clearTimeout(nameAutosaveTimeoutRef.current);
    nameAutosaveTimeoutRef.current = setTimeout(() => {
      saveRequest(nextName).catch((error: unknown) => {
        console.error('Failed to autosave request name', error);
        dispatch(setRequesterError('Failed to autosave request name.'));
      });
    }, 600);
  };

  const sendRequest = async (): Promise<void> => {
    const requestInput = buildRequestInput();
    if (!requestInput) return;

    const saved = await saveRequest();
    const result = await requesterTnetApi.requester.execution.send({
      ...requestInput,
      id: saved?.id ?? requestInput.id,
      timeoutMs: settings.requestTimeoutMs,
      followRedirects: settings.followRedirects
    });
    const history = await requesterTnetApi.requester.history.list({
      workspaceId: requestInput.workspaceId,
      requestId: saved?.id ?? requestInput.id
    });
    dispatch(setRequesterResponse(result.response));
    dispatch(setRequesterHistory(history));
    setSelectedHistoryId(result.historyId);
  };

  const runSend = (): void => {
    sendRequest().catch((error: unknown) => {
      console.error('Failed to send request', error);
      dispatch(setRequesterError('Failed to send request.'));
    });
  };

  const selectBinaryBody = (): void => {
    requesterTnetApi.requester.files
      .selectBinaryBody()
      .then((file) => {
        if (file) setBinaryFilePath(file.path);
      })
      .catch((error: unknown) => {
        console.error('Failed to select binary body', error);
        dispatch(setRequesterError('Failed to select binary body.'));
      });
  };

  const saveResponse = (): void => {
    if (!activeResponse) return;
    requesterTnetApi.requester.files
      .saveResponseBody({
        suggestedName: activeResponse.previewType === 'pdf' ? 'response.pdf' : 'response.txt',
        bodyText: activeResponse.bodyText,
        bodyBase64: activeResponse.bodyBase64
      })
      .catch((error: unknown) => {
        console.error('Failed to save response', error);
        dispatch(setRequesterError('Failed to save response.'));
      });
  };

  const openResponse = (): void => {
    if (!activeResponse) return;
    requesterTnetApi.requester.files
      .openResponseExternally({
        suggestedName:
          activeResponse.previewType === 'pdf'
            ? 'response.pdf'
            : activeResponse.previewType === 'image'
              ? 'response-image'
              : 'response.txt',
        bodyText: activeResponse.bodyText,
        bodyBase64: activeResponse.bodyBase64
      })
      .catch((error: unknown) => {
        console.error('Failed to open response', error);
        dispatch(setRequesterError('Failed to open response.'));
      });
  };

  const showHistoryResponse = (historyId: string): void => {
    requesterTnetApi.requester.history
      .get({ historyId })
      .then((detail) => {
        if (!detail) return;
        setSelectedHistoryId(historyId);
        dispatch(setRequesterResponse(detail.responseSnapshot));
      })
      .catch((error: unknown) => {
        console.error('Failed to load history response', error);
        dispatch(setRequesterError('Failed to load history response.'));
      });
  };

  const requesterStyle = {
    '--requester-code-font-family': settings.codeFontFamily,
    '--requester-code-font-size': `${settings.codeFontSize}px`,
    '--requester-app-font-family': settings.appFontFamily,
    '--requester-app-font-size': `${settings.appFontSize}px`
  } as CSSProperties;

  const introspectGraphql = (): void => {
    if (!activeWorkspaceId || !url.trim()) return;
    requesterTnetApi.requester.graphql
      .introspect({
        workspaceId: activeWorkspaceId,
        endpointUrl: url,
        headers,
        auth: {
          authType,
          authUsername,
          authPassword,
          authToken,
          authApiKeyName,
          authApiKeyValue
        }
      })
      .then((schema) => {
        setGraphqlSchemaTypes(buildGraphqlSchemaSummary(schema.schemaJson));
      })
      .catch((error: unknown) => {
        console.error('Failed to introspect GraphQL schema', error);
        dispatch(setRequesterError('Failed to introspect GraphQL schema.'));
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
    <main className="requester-app" aria-label="Requester" style={requesterStyle}>
      <section className="requester-editor" aria-label="API request editor">
        <header className="requester-editor-header">
          <input
            className="requester-name-input"
            aria-label="Request name"
            value={name}
            onChange={(event) => scheduleNameAutosave(event.target.value)}
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
          <button
            type="button"
            className="open-folder-button"
            disabled={!url.trim()}
            onClick={runSend}
          >
            Send
          </button>
        </div>
        <section className="requester-body-editor">
          <section className="requester-auth-section" aria-label="Auth">
            <label>
              Auth
              <select
                aria-label="Auth type"
                value={authType}
                onChange={(event) => setAuthType(event.target.value as typeof authType)}
              >
                <option value="none">none</option>
                <option value="basic">basic</option>
                <option value="bearer">bearer</option>
                <option value="api-key-header">api-key-header</option>
                <option value="api-key-query">api-key-query</option>
              </select>
            </label>
            {authType === 'basic' ? (
              <div className="requester-auth-fields">
                <input
                  aria-label="Auth username"
                  placeholder="Username"
                  value={authUsername}
                  onChange={(event) => setAuthUsername(event.target.value)}
                />
                <input
                  aria-label="Auth password"
                  placeholder="Password"
                  type="password"
                  value={authPassword}
                  onChange={(event) => setAuthPassword(event.target.value)}
                />
              </div>
            ) : authType === 'bearer' ? (
              <input
                aria-label="Bearer token"
                placeholder="Token"
                type="password"
                value={authToken}
                onChange={(event) => setAuthToken(event.target.value)}
              />
            ) : authType === 'api-key-header' || authType === 'api-key-query' ? (
              <div className="requester-auth-fields">
                <input
                  aria-label="API key name"
                  placeholder="Key"
                  value={authApiKeyName}
                  onChange={(event) => setAuthApiKeyName(event.target.value)}
                />
                <input
                  aria-label="API key value"
                  placeholder="Value"
                  type="password"
                  value={authApiKeyValue}
                  onChange={(event) => setAuthApiKeyValue(event.target.value)}
                />
              </div>
            ) : null}
          </section>
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
          {bodyMode === 'graphql' ? (
            <div className="requester-graphql-fields">
              <input
                aria-label="GraphQL operation name"
                placeholder="Operation name"
                value={graphqlOperationName}
                onChange={(event) => setGraphqlOperationName(event.target.value)}
              />
              <button type="button" className="open-folder-button" onClick={introspectGraphql}>
                Introspect
              </button>
              <JsonTextEditor
                ariaLabel="GraphQL variables"
                value={graphqlVariablesText}
                onChange={setGraphqlVariablesText}
                minHeight={84}
              />
              {graphqlSchemaTypes.length > 0 ? (
                <details className="requester-graphql-schema" open>
                  <summary>Schema types</summary>
                  <div className="requester-graphql-schema-grid">
                    {graphqlSchemaTypes.map((type) => (
                      <div
                        className="requester-graphql-schema-row"
                        key={`${type.kind}:${type.name}`}
                      >
                        <span>{type.name}</span>
                        <span>{type.kind}</span>
                        <span>{type.fieldCount}</span>
                      </div>
                    ))}
                  </div>
                </details>
              ) : null}
            </div>
          ) : null}
          {bodyMode === 'json' ? (
            <JsonTextEditor ariaLabel="Request body" value={bodyText} onChange={setBodyText} />
          ) : (
            <textarea
              aria-label="Request body"
              value={bodyText}
              disabled={bodyMode === 'none' || bodyMode === 'binary-file'}
              onChange={(event) => setBodyText(event.target.value)}
            />
          )}
          {bodyMode === 'binary-file' ? (
            <div className="requester-binary-body-row">
              <input aria-label="Binary body file" value={binaryFilePath} readOnly />
              <button type="button" className="open-folder-button" onClick={selectBinaryBody}>
                Select File
              </button>
            </div>
          ) : null}
        </section>
        {error ? <p className="requester-error">{error}</p> : null}
      </section>
      <section className="requester-response-placeholder" aria-label="API response">
        <h2>Response</h2>
        {activeResponse ? (
          <>
            <dl className="requester-response-summary">
              <div>
                <dt>Status</dt>
                <dd>
                  {activeResponse.status} {activeResponse.statusText}
                </dd>
              </div>
              <div>
                <dt>Time</dt>
                <dd>{activeResponse.durationMs} ms</dd>
              </div>
              <div>
                <dt>Size</dt>
                <dd>{activeResponse.byteSize} bytes</dd>
              </div>
            </dl>
            <div className="requester-response-actions">
              <button type="button" className="open-folder-button" onClick={saveResponse}>
                Save Body
              </button>
              <button type="button" className="open-folder-button" onClick={openResponse}>
                Open
              </button>
            </div>
            {activeResponse.isBodyTruncated ? (
              <p className="requester-error">Response body preview was truncated at 1 MB.</p>
            ) : null}
            <section className="requester-response-detail" aria-label="Response details">
              <div>
                <span>Content-Type</span>
                <strong>{activeResponse.contentType || '-'}</strong>
              </div>
              <div>
                <span>Preview</span>
                <strong>{activeResponse.previewType}</strong>
              </div>
              <div>
                <span>Truncated</span>
                <strong>{activeResponse.isBodyTruncated ? 'yes' : 'no'}</strong>
              </div>
            </section>
            <section className="requester-response-headers" aria-label="Response headers">
              <h3>Headers</h3>
              {activeResponse.headers.length > 0 ? (
                <div className="requester-response-header-grid">
                  {activeResponse.headers.map((header) => (
                    <div className="requester-response-header-row" key={header.id}>
                      <span>{header.key}</span>
                      <span>{header.value}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p>No headers.</p>
              )}
            </section>
            {activeResponse.previewType === 'image' ? (
              <img
                className="requester-response-image"
                alt="Response preview"
                src={`data:${activeResponse.contentType};base64,${activeResponse.bodyBase64}`}
              />
            ) : activeResponse.previewType === 'pdf' ? (
              <iframe
                className="requester-response-pdf"
                title="PDF response preview"
                src={`data:application/pdf;base64,${activeResponse.bodyBase64}`}
              />
            ) : (
              <pre className="requester-response-body">{activeResponse.bodyText}</pre>
            )}
          </>
        ) : (
          <p>Send a request to view the response.</p>
        )}
        <section className="requester-history-list" aria-label="Request history">
          <h3>History</h3>
          {history.slice(0, 5).map((entry) => (
            <button
              type="button"
              className={`requester-history-row ${
                entry.id === selectedHistoryId ? 'requester-history-row-selected' : ''
              }`}
              key={entry.id}
              onClick={() => showHistoryResponse(entry.id)}
            >
              <span>{entry.method}</span>
              <span>{entry.status ?? '-'}</span>
              <span>{entry.requestName}</span>
              <time>{new Date(entry.startedAt).toLocaleTimeString()}</time>
            </button>
          ))}
          {history.length === 0 ? <p>No history yet.</p> : null}
        </section>
      </section>
    </main>
  );
};
