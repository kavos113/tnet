import type {
  RequesterAuthType,
  RequesterBodyMode,
  RequesterHttpMethod,
  RequesterKeyValueRow
} from '@tnet/app-requester/shared/requesterTypes';
import { JsonTextEditor } from './JsonTextEditor';
import { RequesterKeyValueTable } from './RequesterKeyValueTable';
import type { GraphqlSchemaTypeSummary } from './requesterAppHelpers';

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

export interface RequesterEditorProps {
  name: string;
  method: RequesterHttpMethod;
  url: string;
  headers: RequesterKeyValueRow[];
  queryParams: RequesterKeyValueRow[];
  bodyMode: RequesterBodyMode;
  bodyText: string;
  binaryFilePath: string;
  graphqlVariablesText: string;
  graphqlOperationName: string;
  authType: RequesterAuthType;
  authUsername: string;
  authPassword: string;
  authToken: string;
  authApiKeyName: string;
  authApiKeyValue: string;
  graphqlSchemaTypes: GraphqlSchemaTypeSummary[];
  error?: string;
  onNameChange: (value: string) => void;
  onMethodChange: (value: RequesterHttpMethod) => void;
  onUrlChange: (value: string) => void;
  onHeadersChange: (value: RequesterKeyValueRow[]) => void;
  onQueryParamsChange: (value: RequesterKeyValueRow[]) => void;
  onBodyModeChange: (value: RequesterBodyMode) => void;
  onBodyTextChange: (value: string) => void;
  onBinaryFilePathSelect: () => void;
  onGraphqlVariablesTextChange: (value: string) => void;
  onGraphqlOperationNameChange: (value: string) => void;
  onAuthTypeChange: (value: RequesterAuthType) => void;
  onAuthUsernameChange: (value: string) => void;
  onAuthPasswordChange: (value: string) => void;
  onAuthTokenChange: (value: string) => void;
  onAuthApiKeyNameChange: (value: string) => void;
  onAuthApiKeyValueChange: (value: string) => void;
  onSave: () => void;
  onSend: () => void;
  onIntrospectGraphql: () => void;
}

export const RequesterEditor = ({
  name,
  method,
  url,
  headers,
  queryParams,
  bodyMode,
  bodyText,
  binaryFilePath,
  graphqlVariablesText,
  graphqlOperationName,
  authType,
  authUsername,
  authPassword,
  authToken,
  authApiKeyName,
  authApiKeyValue,
  graphqlSchemaTypes,
  error,
  onNameChange,
  onMethodChange,
  onUrlChange,
  onHeadersChange,
  onQueryParamsChange,
  onBodyModeChange,
  onBodyTextChange,
  onBinaryFilePathSelect,
  onGraphqlVariablesTextChange,
  onGraphqlOperationNameChange,
  onAuthTypeChange,
  onAuthUsernameChange,
  onAuthPasswordChange,
  onAuthTokenChange,
  onAuthApiKeyNameChange,
  onAuthApiKeyValueChange,
  onSave,
  onSend,
  onIntrospectGraphql
}: RequesterEditorProps): React.JSX.Element => (
  <section className="requester-editor" aria-label="API request editor">
    <header className="requester-editor-header">
      <input
        className="requester-name-input"
        aria-label="Request name"
        value={name}
        onChange={(event) => onNameChange(event.target.value)}
      />
      <button type="button" className="open-folder-button" onClick={onSave}>
        Save
      </button>
    </header>
    <div className="requester-url-row">
      <select
        aria-label="HTTP method"
        value={method}
        onChange={(event) => onMethodChange(event.target.value as RequesterHttpMethod)}
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
        onChange={(event) => onUrlChange(event.target.value)}
      />
      <button type="button" className="open-folder-button" disabled={!url.trim()} onClick={onSend}>
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
            onChange={(event) => onAuthTypeChange(event.target.value as RequesterAuthType)}
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
              onChange={(event) => onAuthUsernameChange(event.target.value)}
            />
            <input
              aria-label="Auth password"
              placeholder="Password"
              type="password"
              value={authPassword}
              onChange={(event) => onAuthPasswordChange(event.target.value)}
            />
          </div>
        ) : authType === 'bearer' ? (
          <input
            aria-label="Bearer token"
            placeholder="Token"
            type="password"
            value={authToken}
            onChange={(event) => onAuthTokenChange(event.target.value)}
          />
        ) : authType === 'api-key-header' || authType === 'api-key-query' ? (
          <div className="requester-auth-fields">
            <input
              aria-label="API key name"
              placeholder="Key"
              value={authApiKeyName}
              onChange={(event) => onAuthApiKeyNameChange(event.target.value)}
            />
            <input
              aria-label="API key value"
              placeholder="Value"
              type="password"
              value={authApiKeyValue}
              onChange={(event) => onAuthApiKeyValueChange(event.target.value)}
            />
          </div>
        ) : null}
      </section>
      <div className="requester-kv-grid">
        <RequesterKeyValueTable
          label="Query Params"
          rows={queryParams}
          onChange={onQueryParamsChange}
        />
        <RequesterKeyValueTable label="Headers" rows={headers} onChange={onHeadersChange} />
      </div>
      <label>
        Body
        <select
          aria-label="Body mode"
          value={bodyMode}
          onChange={(event) => onBodyModeChange(event.target.value as RequesterBodyMode)}
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
            onChange={(event) => onGraphqlOperationNameChange(event.target.value)}
          />
          <button type="button" className="open-folder-button" onClick={onIntrospectGraphql}>
            Introspect
          </button>
          <JsonTextEditor
            ariaLabel="GraphQL variables"
            value={graphqlVariablesText}
            onChange={onGraphqlVariablesTextChange}
            minHeight={84}
          />
          {graphqlSchemaTypes.length > 0 ? (
            <details className="requester-graphql-schema" open>
              <summary>Schema types</summary>
              <div className="requester-graphql-schema-grid">
                {graphqlSchemaTypes.map((type) => (
                  <div className="requester-graphql-schema-row" key={`${type.kind}:${type.name}`}>
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
        <JsonTextEditor ariaLabel="Request body" value={bodyText} onChange={onBodyTextChange} />
      ) : (
        <textarea
          aria-label="Request body"
          value={bodyText}
          disabled={bodyMode === 'none' || bodyMode === 'binary-file'}
          onChange={(event) => onBodyTextChange(event.target.value)}
        />
      )}
      {bodyMode === 'binary-file' ? (
        <div className="requester-binary-body-row">
          <input aria-label="Binary body file" value={binaryFilePath} readOnly />
          <button type="button" className="open-folder-button" onClick={onBinaryFilePathSelect}>
            Select File
          </button>
        </div>
      ) : null}
    </section>
    {error ? <p className="requester-error">{error}</p> : null}
  </section>
);
