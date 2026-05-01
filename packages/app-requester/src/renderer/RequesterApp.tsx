import { useEffect, useRef, useState, type CSSProperties } from 'react';
import type { RequesterVariable } from '@tnet/app-requester/shared/requesterTypes';
import { setRequesterError, setRequesterHistory } from './requesterSlice';
import { RequesterEditor } from './request/RequesterEditor';
import { RequesterPlaceholder } from './request/RequesterPlaceholder';
import { useRequesterRequestActions } from './request/useRequesterRequestActions';
import { useRequesterRequestDraft } from './request/useRequesterRequestDraft';
import { requesterTnetApi } from './requesterTnetApi';
import { RequesterResponsePanel } from './response/RequesterResponsePanel';
import { useRequesterDispatch, useRequesterSelector } from './storeHooks';

export const RequesterApp = (): React.JSX.Element => {
  const dispatch = useRequesterDispatch();
  const activeRequest = useRequesterSelector((state) => state.requester.activeRequest);
  const activeResponse = useRequesterSelector((state) => state.requester.activeResponse);
  const activeResponseError = useRequesterSelector((state) => state.requester.activeResponseError);
  const activeWorkspaceId = useRequesterSelector((state) => state.requester.activeWorkspaceId);
  const error = useRequesterSelector((state) => state.requester.error);
  const history = useRequesterSelector((state) => state.requester.history);
  const isRestored = useRequesterSelector((state) => state.requester.isRestored);
  const settings = useRequesterSelector((state) => state.requester.settings);
  const draft = useRequesterRequestDraft(activeRequest, activeWorkspaceId);
  const [variables, setVariables] = useState<RequesterVariable[]>([]);
  const [selectedHistoryId, setSelectedHistoryId] = useState<string>();
  const nameAutosaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const actions = useRequesterRequestActions({
    activeResponse,
    activeWorkspaceId,
    draft,
    settings,
    setSelectedHistoryId
  });

  useEffect(() => {
    if (nameAutosaveTimeoutRef.current) clearTimeout(nameAutosaveTimeoutRef.current);
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

  useEffect(() => {
    if (!settings.defaultVariableSetId) {
      setVariables([]);
      return;
    }

    let canceled = false;
    requesterTnetApi.requester.variableSets
      .listVariables({ variableSetId: settings.defaultVariableSetId })
      .then((variables) => {
        if (!canceled) setVariables(variables);
      })
      .catch((error: unknown) => {
        console.error('Failed to load requester variables', error);
        if (!canceled) dispatch(setRequesterError('Failed to load requester variables.'));
      });

    return () => {
      canceled = true;
    };
  }, [dispatch, settings.defaultVariableSetId]);

  const scheduleNameAutosave = (nextName: string): void => {
    draft.setName(nextName);
    if (nameAutosaveTimeoutRef.current) clearTimeout(nameAutosaveTimeoutRef.current);
    nameAutosaveTimeoutRef.current = setTimeout(() => {
      actions.saveRequest(nextName).catch((error: unknown) => {
        console.error('Failed to autosave request name', error);
        dispatch(setRequesterError('Failed to autosave request name.'));
      });
    }, 600);
  };

  const requesterStyle = {
    '--requester-code-font-family': settings.codeFontFamily,
    '--requester-code-font-size': `${settings.codeFontSize}px`,
    '--requester-app-font-family': settings.appFontFamily,
    '--requester-app-font-size': `${settings.appFontSize}px`
  } as CSSProperties;

  if (!isRestored) {
    return (
      <RequesterPlaceholder
        icon="api"
        title="Requester"
        message="Restoring request workspaces..."
      />
    );
  }

  if (!activeWorkspaceId) {
    return (
      <RequesterPlaceholder
        icon="api"
        title="Requester"
        message="Create a request workspace to begin."
      />
    );
  }

  if (!activeRequest) {
    return (
      <RequesterPlaceholder
        icon="article"
        title="No request selected"
        message="Create or select a request from the sidebar."
      />
    );
  }

  return (
    <main className="requester-app" aria-label="Requester" style={requesterStyle}>
      <RequesterEditor
        name={draft.name}
        method={draft.method}
        url={draft.url}
        headers={draft.headers}
        queryParams={draft.queryParams}
        bodyMode={draft.bodyMode}
        bodyText={draft.bodyText}
        binaryFilePath={draft.binaryFilePath}
        graphqlVariablesText={draft.graphqlVariablesText}
        graphqlOperationName={draft.graphqlOperationName}
        authType={draft.authType}
        authUsername={draft.authUsername}
        authPassword={draft.authPassword}
        authToken={draft.authToken}
        authApiKeyName={draft.authApiKeyName}
        authApiKeyValue={draft.authApiKeyValue}
        graphqlSchemaTypes={draft.graphqlSchemaTypes}
        extractionRules={draft.extractionRules}
        variables={variables}
        error={error}
        onNameChange={scheduleNameAutosave}
        onMethodChange={draft.setMethod}
        onUrlChange={draft.setUrl}
        onHeadersChange={draft.setHeaders}
        onQueryParamsChange={draft.setQueryParams}
        onBodyModeChange={draft.setBodyMode}
        onBodyTextChange={draft.setBodyText}
        onBinaryFilePathSelect={actions.selectBinaryBody}
        onGraphqlVariablesTextChange={draft.setGraphqlVariablesText}
        onGraphqlOperationNameChange={draft.setGraphqlOperationName}
        onAuthTypeChange={draft.setAuthType}
        onAuthUsernameChange={draft.setAuthUsername}
        onAuthPasswordChange={draft.setAuthPassword}
        onAuthTokenChange={draft.setAuthToken}
        onAuthApiKeyNameChange={draft.setAuthApiKeyName}
        onAuthApiKeyValueChange={draft.setAuthApiKeyValue}
        onExtractionRulesChange={draft.setExtractionRules}
        onSave={actions.runSave}
        onSend={actions.runSend}
        onIntrospectGraphql={actions.introspectGraphql}
      />
      <RequesterResponsePanel
        response={activeResponse}
        error={activeResponseError}
        extractionRules={draft.extractionRules}
        history={history}
        selectedHistoryId={selectedHistoryId}
        onSaveResponse={actions.saveResponse}
        onOpenResponse={actions.openResponse}
        onSelectHistory={actions.showHistoryResponse}
      />
    </main>
  );
};
