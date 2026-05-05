import { useEffect, useState } from 'react';
import type {
  RequesterAuthType,
  RequesterBodyMode,
  RequesterExtractionRule,
  RequesterHttpMethod,
  RequesterKeyValueRow,
  RequesterRequestType,
  RequesterVariable
} from '@tnet/app-requester/shared/requesterTypes';
import { RequesterExtractionRulesEditor } from './RequesterExtractionRulesEditor';
import { JsonTextEditor } from './JsonTextEditor';
import { RequesterKeyValueTable } from './RequesterKeyValueTable';
import { RequesterVariableSuggestions } from './RequesterVariableSuggestions';
import type { GraphqlSchemaTypeSummary } from './requesterAppHelpers';
import controlStyles from '../RequesterControls.module.css';
import { formatJsonText } from '../requesterJsonFormat';
import bodyStyles from './RequesterEditorBody.module.css';
import graphqlStyles from './RequesterEditorGraphql.module.css';
import styles from './RequesterEditor.module.css';

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
  requestType: RequesterRequestType;
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
  extractionRules: RequesterExtractionRule[];
  variables: RequesterVariable[];
  grpcProtoPath: string;
  grpcPackageName: string;
  grpcServiceName: string;
  grpcMethodName: string;
  grpcMetadata: RequesterKeyValueRow[];
  error?: string;
  onNameChange: (value: string) => void;
  onRequestTypeChange: (value: RequesterRequestType) => void;
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
  onExtractionRulesChange: (value: RequesterExtractionRule[]) => void;
  onGrpcProtoPathChange: (value: string) => void;
  onGrpcPackageNameChange: (value: string) => void;
  onGrpcServiceNameChange: (value: string) => void;
  onGrpcMethodNameChange: (value: string) => void;
  onGrpcMetadataChange: (value: RequesterKeyValueRow[]) => void;
  onGrpcProtoPathSelect: () => void;
  onSave: () => void;
  onSend: () => void;
  onIntrospectGraphql: () => void;
}

export const RequesterEditor = ({
  name,
  requestType,
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
  extractionRules,
  variables,
  grpcProtoPath,
  grpcPackageName,
  grpcServiceName,
  grpcMethodName,
  grpcMetadata,
  error,
  onNameChange,
  onRequestTypeChange,
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
  onExtractionRulesChange,
  onGrpcProtoPathChange,
  onGrpcPackageNameChange,
  onGrpcServiceNameChange,
  onGrpcMethodNameChange,
  onGrpcMetadataChange,
  onGrpcProtoPathSelect,
  onSave,
  onSend,
  onIntrospectGraphql
}: RequesterEditorProps): React.JSX.Element => {
  const [bodyFormatError, setBodyFormatError] = useState<string>();

  useEffect(() => {
    setBodyFormatError(undefined);
  }, [bodyMode, requestType]);

  const canFormatBody = requestType === 'grpc' || bodyMode === 'json';
  const changeBodyText = (value: string): void => {
    setBodyFormatError(undefined);
    onBodyTextChange(value);
  };
  const formatRequestBody = (): void => {
    const formatted = formatJsonText(bodyText);
    if (!formatted.ok) {
      setBodyFormatError(`Invalid JSON: ${formatted.error}`);
      return;
    }
    setBodyFormatError(undefined);
    onBodyTextChange(formatted.value);
  };

  return (
    <section className={styles.root} aria-label="API request editor">
      <header className={styles.header}>
        <input
          className={styles.nameInput}
          aria-label="Request name"
          value={name}
          onChange={(event) => onNameChange(event.target.value)}
        />
        <button type="button" className={controlStyles.openButton} onClick={onSave}>
          Save
        </button>
      </header>
      <div className={styles.urlRow}>
        <select
          aria-label="Request type"
          value={requestType}
          onChange={(event) => onRequestTypeChange(event.target.value as RequesterRequestType)}
        >
          <option value="http">HTTP</option>
          <option value="grpc">gRPC</option>
          <option value="websocket">WebSocket</option>
        </select>
        <select
          aria-label="HTTP method"
          value={method}
          disabled={requestType !== 'http'}
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
          placeholder={requestType === 'grpc' ? 'localhost:50051' : 'https://api.example.test'}
          value={url}
          onChange={(event) => onUrlChange(event.target.value)}
        />
        <button
          type="button"
          className={controlStyles.openButton}
          disabled={!url.trim()}
          onClick={onSend}
        >
          Send
        </button>
      </div>
      <section className={bodyStyles.bodyEditor}>
        {requestType === 'grpc' ? (
          <section className={bodyStyles.grpcSection} aria-label="gRPC request settings">
            <div className={bodyStyles.grpcProtoRow}>
              <input
                aria-label="gRPC proto file"
                placeholder="Path to .proto"
                value={grpcProtoPath}
                onChange={(event) => onGrpcProtoPathChange(event.target.value)}
              />
              <button
                type="button"
                className={controlStyles.openButton}
                onClick={onGrpcProtoPathSelect}
              >
                Select Proto
              </button>
            </div>
            <div className={bodyStyles.grpcMethodGrid}>
              <input
                aria-label="gRPC package"
                placeholder="package, e.g. tnet.papers.v1"
                value={grpcPackageName}
                onChange={(event) => onGrpcPackageNameChange(event.target.value)}
              />
              <input
                aria-label="gRPC service"
                placeholder="Service"
                value={grpcServiceName}
                onChange={(event) => onGrpcServiceNameChange(event.target.value)}
              />
              <input
                aria-label="gRPC method"
                placeholder="Method"
                value={grpcMethodName}
                onChange={(event) => onGrpcMethodNameChange(event.target.value)}
              />
            </div>
            <RequesterKeyValueTable
              label="gRPC Metadata"
              rows={grpcMetadata}
              onChange={onGrpcMetadataChange}
            />
          </section>
        ) : (
          <section className={bodyStyles.authSection} aria-label="Auth">
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
              <div className={bodyStyles.authFields}>
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
              <div className={bodyStyles.authFields}>
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
        )}
        {requestType === 'grpc' ? null : (
          <div className={bodyStyles.kvGrid}>
            <RequesterKeyValueTable
              label="Query Params"
              rows={queryParams}
              onChange={onQueryParamsChange}
            />
            <RequesterKeyValueTable label="Headers" rows={headers} onChange={onHeadersChange} />
          </div>
        )}
        <RequesterVariableSuggestions variables={variables} />
        <div className={bodyStyles.bodyHeader}>
          {requestType === 'grpc' ? (
            <span>Message JSON</span>
          ) : (
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
          )}
          {canFormatBody ? (
            <button
              type="button"
              className={controlStyles.secondaryButton}
              disabled={!bodyText.trim()}
              onClick={formatRequestBody}
            >
              Format
            </button>
          ) : null}
        </div>
        {bodyFormatError ? (
          <p className={bodyStyles.formatError} role="alert">
            {bodyFormatError}
          </p>
        ) : null}
        {requestType !== 'grpc' && bodyMode === 'graphql' ? (
          <div className={graphqlStyles.graphqlFields}>
            <input
              aria-label="GraphQL operation name"
              placeholder="Operation name"
              value={graphqlOperationName}
              onChange={(event) => onGraphqlOperationNameChange(event.target.value)}
            />
            <button
              type="button"
              className={controlStyles.openButton}
              onClick={onIntrospectGraphql}
            >
              Introspect
            </button>
            <JsonTextEditor
              ariaLabel="GraphQL variables"
              className={bodyStyles.jsonEditor}
              value={graphqlVariablesText}
              onChange={onGraphqlVariablesTextChange}
              minHeight={84}
            />
            {graphqlSchemaTypes.length > 0 ? (
              <details className={graphqlStyles.graphqlSchema} open>
                <summary>Schema types</summary>
                <div className={graphqlStyles.graphqlSchemaGrid}>
                  {graphqlSchemaTypes.map((type) => (
                    <div
                      className={graphqlStyles.graphqlSchemaRow}
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
        {requestType === 'grpc' || bodyMode === 'json' ? (
          <JsonTextEditor
            ariaLabel="Request body"
            className={bodyStyles.jsonEditor}
            value={bodyText}
            onChange={changeBodyText}
          />
        ) : (
          <textarea
            aria-label="Request body"
            value={bodyText}
            disabled={bodyMode === 'none' || bodyMode === 'binary-file'}
            onChange={(event) => changeBodyText(event.target.value)}
          />
        )}
        {requestType !== 'grpc' && bodyMode === 'binary-file' ? (
          <div className={bodyStyles.binaryBodyRow}>
            <input aria-label="Binary body file" value={binaryFilePath} readOnly />
            <button
              type="button"
              className={controlStyles.openButton}
              onClick={onBinaryFilePathSelect}
            >
              Select File
            </button>
          </div>
        ) : null}
        <RequesterExtractionRulesEditor
          rules={extractionRules}
          onChange={onExtractionRulesChange}
        />
      </section>
      {error ? <p className={styles.error}>{error}</p> : null}
    </section>
  );
};
