import type { Dispatch, SetStateAction } from 'react';
import type { RequesterWorkspaceSettings } from '@tnet/app-requester/shared/config';
import type {
  RequesterRequestDetail,
  RequesterResponseSnapshot
} from '@tnet/app-requester/shared/requesterTypes';
import {
  setActiveRequesterRequest,
  setRequesterError,
  setRequesterHistory,
  setRequesterRequests,
  setRequesterRequestSnapshot,
  setRequesterResponse,
  setRequesterResponseError
} from '../requesterSlice';
import { requesterTnetApi } from '../requesterTnetApi';
import { useRequesterDispatch } from '../storeHooks';
import { buildGraphqlSchemaSummary, toExecutionErrorSnapshot } from './requesterAppHelpers';
import type { RequesterRequestDraft } from './useRequesterRequestDraft';

interface UseRequesterRequestActionsInput {
  activeResponse?: RequesterResponseSnapshot;
  activeWorkspaceId?: string;
  draft: RequesterRequestDraft;
  settings: RequesterWorkspaceSettings;
  setSelectedHistoryId: Dispatch<SetStateAction<string | undefined>>;
}

interface RequesterRequestActions {
  introspectGraphql: () => void;
  openResponse: () => void;
  runSave: () => void;
  runSend: () => void;
  saveRequest: (nameOverride?: string) => Promise<RequesterRequestDetail | undefined>;
  saveResponse: () => void;
  selectBinaryBody: () => void;
  selectGrpcProto: () => void;
  showHistoryResponse: (historyId: string) => void;
}

export const useRequesterRequestActions = ({
  activeResponse,
  activeWorkspaceId,
  draft,
  settings,
  setSelectedHistoryId
}: UseRequesterRequestActionsInput): RequesterRequestActions => {
  const dispatch = useRequesterDispatch();

  const saveRequest = async (
    nameOverride?: string
  ): Promise<RequesterRequestDetail | undefined> => {
    const requestInput = draft.buildRequestInput(nameOverride);
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

  const sendRequest = async (): Promise<void> => {
    const requestInput = draft.buildRequestInput();
    if (!requestInput) return;

    const saved = await saveRequest();
    const result = await requesterTnetApi.requester.execution.send({
      ...requestInput,
      id: saved?.id ?? requestInput.id,
      timeoutMs: settings.requestTimeoutMs,
      followRedirects: settings.followRedirects,
      cookieJarEnabled: settings.cookieJarEnabled,
      validateTlsCertificates: settings.validateTlsCertificates,
      proxyMode: settings.proxyMode,
      proxyHost: settings.proxyHost,
      proxyPort: settings.proxyPort,
      proxyUsername: settings.proxyUsername,
      proxyPasswordSecretId: settings.proxyPasswordSecretId,
      clientCertificatePath: settings.clientCertificatePath,
      clientCertificateKeyPath: settings.clientCertificateKeyPath,
      clientCertificatePassphraseSecretId: settings.clientCertificatePassphraseSecretId,
      customCaCertificatePath: settings.customCaCertificatePath,
      variableSetId: settings.defaultVariableSetId
    });
    const history = await requesterTnetApi.requester.history.list({
      workspaceId: requestInput.workspaceId,
      requestId: saved?.id ?? requestInput.id
    });
    dispatch(setRequesterRequestSnapshot(result.requestSnapshot));
    dispatch(setRequesterResponse(result.response));
    dispatch(setRequesterResponseError(undefined));
    dispatch(setRequesterHistory(history));
    setSelectedHistoryId(result.historyId);
  };

  const runSend = (): void => {
    sendRequest().catch((error: unknown) => {
      console.error('Failed to send request', error);
      dispatch(setRequesterResponseError(toExecutionErrorSnapshot(error)));
      dispatch(setRequesterError('Failed to send request.'));
    });
  };

  const selectBinaryBody = (): void => {
    requesterTnetApi.requester.files
      .selectBinaryBody()
      .then((file) => {
        if (file) draft.setBinaryFilePath(file.path);
      })
      .catch((error: unknown) => {
        console.error('Failed to select binary body', error);
        dispatch(setRequesterError('Failed to select binary body.'));
      });
  };

  const selectGrpcProto = (): void => {
    requesterTnetApi.requester.files
      .selectGrpcProto()
      .then((file) => {
        if (file) draft.setGrpcProtoPath(file.path);
      })
      .catch((error: unknown) => {
        console.error('Failed to select gRPC proto file', error);
        dispatch(setRequesterError('Failed to select gRPC proto file.'));
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
        dispatch(setRequesterRequestSnapshot(detail.requestSnapshot));
        dispatch(setRequesterResponse(detail.responseSnapshot));
      })
      .catch((error: unknown) => {
        console.error('Failed to load history response', error);
        dispatch(setRequesterError('Failed to load history response.'));
      });
  };

  const introspectGraphql = (): void => {
    if (!activeWorkspaceId || !draft.url.trim()) return;
    requesterTnetApi.requester.graphql
      .introspect({
        workspaceId: activeWorkspaceId,
        endpointUrl: draft.url,
        headers: draft.headers,
        auth: {
          authType: draft.authType,
          authUsername: draft.authUsername,
          authPassword: draft.authPassword,
          authToken: draft.authToken,
          authApiKeyName: draft.authApiKeyName,
          authApiKeyValue: draft.authApiKeyValue
        }
      })
      .then((schema) => {
        draft.setGraphqlSchemaTypes(buildGraphqlSchemaSummary(schema.schemaJson));
      })
      .catch((error: unknown) => {
        console.error('Failed to introspect GraphQL schema', error);
        dispatch(setRequesterError('Failed to introspect GraphQL schema.'));
      });
  };

  return {
    introspectGraphql,
    openResponse,
    runSave,
    runSend,
    saveRequest,
    saveResponse,
    selectBinaryBody,
    selectGrpcProto,
    showHistoryResponse
  };
};
