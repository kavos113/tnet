import { useMemo, useState } from 'react';
import type {
  RequesterExecutionErrorSnapshot,
  RequesterExtractionRule,
  RequesterHistoryEntry,
  RequesterRequestSnapshot,
  RequesterResponseSnapshot
} from '@tnet/app-requester/shared/requesterTypes';
import { extractVariablesFromResponse } from '@tnet/app-requester/shared/responseExtraction';
import 'highlight.js/styles/github.css';
import contentStyles from './RequesterResponseContent.module.css';
import headersStyles from './RequesterResponseHeaders.module.css';
import historyStyles from './RequesterResponseHistory.module.css';
import { RequesterExchangeSummary } from './RequesterExchangeSummary';
import styles from './RequesterResponsePanel.module.css';
import {
  getRequestLanguage,
  getResponseLanguage,
  highlightRequesterBody
} from './requesterHighlight';
import { useVerticalResize } from './useVerticalResize';

interface RequesterResponsePanelProps {
  request?: RequesterRequestSnapshot;
  response?: RequesterResponseSnapshot;
  error?: RequesterExecutionErrorSnapshot;
  extractionRules: RequesterExtractionRule[];
  history: RequesterHistoryEntry[];
  selectedHistoryId?: string;
  onSaveResponse: () => void;
  onOpenResponse: () => void;
  onSelectHistory: (historyId: string) => void;
}

export const RequesterResponsePanel = ({
  request,
  response,
  error,
  extractionRules,
  history,
  selectedHistoryId,
  onSaveResponse,
  onOpenResponse,
  onSelectHistory
}: RequesterResponsePanelProps): React.JSX.Element => {
  const [activePanelTab, setActivePanelTab] = useState<'request' | 'response'>('response');

  return (
    <section className={styles.root} aria-label="API response">
      <div className={styles.header}>
        <h2>Response</h2>
        {response ? (
          <div className={styles.headerActions}>
            <button type="button" className={styles.headerButton} onClick={onSaveResponse}>
              Save Body
            </button>
            <button type="button" className={styles.headerButton} onClick={onOpenResponse}>
              Open
            </button>
          </div>
        ) : null}
      </div>
      {error ? (
        <section className={styles.error} aria-label="Response error details">
          <h3>Request failed</h3>
          <dl className={contentStyles.summary}>
            <div>
              <dt>Name</dt>
              <dd>{error.name}</dd>
            </div>
            <div>
              <dt>Message</dt>
              <dd>{error.message}</dd>
            </div>
            <div>
              <dt>Cause</dt>
              <dd>{error.cause ?? '-'}</dd>
            </div>
          </dl>
          {error.stack ? <pre className={contentStyles.body}>{error.stack}</pre> : null}
        </section>
      ) : response ? (
        <>
          <RequesterExchangeSummary request={request} response={response} />
          <div className={contentStyles.tabs} role="tablist" aria-label="Exchange view">
            <button
              type="button"
              role="tab"
              aria-selected={activePanelTab === 'request'}
              className={activePanelTab === 'request' ? contentStyles.tabActive : contentStyles.tab}
              onClick={() => setActivePanelTab('request')}
            >
              Request
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activePanelTab === 'response'}
              className={
                activePanelTab === 'response' ? contentStyles.tabActive : contentStyles.tab
              }
              onClick={() => setActivePanelTab('response')}
            >
              Response
            </button>
          </div>
          {activePanelTab === 'request' ? (
            request ? (
              <RequesterRequestContent request={request} />
            ) : (
              <p>No request snapshot.</p>
            )
          ) : (
            <RequesterResponseContent response={response} extractionRules={extractionRules} />
          )}
        </>
      ) : (
        <p>Send a request to view the response.</p>
      )}
      <section className={historyStyles.history} aria-label="Request history">
        <h3>History</h3>
        {history.slice(0, 5).map((entry) => (
          <button
            type="button"
            className={`${historyStyles.historyRow} ${
              entry.id === selectedHistoryId ? historyStyles.historyRowSelected : ''
            }`}
            key={entry.id}
            onClick={() => onSelectHistory(entry.id)}
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
  );
};

const RequesterRequestContent = ({
  request
}: {
  request: RequesterRequestSnapshot;
}): React.JSX.Element => {
  const { height: headersHeight, startResize: startHeadersResize } = useVerticalResize(
    120,
    72,
    280
  );

  return (
    <>
      {request.isBodyTruncated ? (
        <p className={contentStyles.errorText}>Request body preview was truncated at 1 MB.</p>
      ) : null}
      <section className={contentStyles.detail} aria-label="Request details">
        <div>
          <span>Original URL</span>
          <strong>{request.url}</strong>
        </div>
        <div>
          <span>Body Mode</span>
          <strong>{request.bodyMode}</strong>
        </div>
        <div>
          <span>Size</span>
          <strong>{request.byteSize} bytes</strong>
        </div>
      </section>
      <section className={headersStyles.headers} aria-label="Request headers">
        <h3>Headers</h3>
        {request.headers.length > 0 ? (
          <div className={headersStyles.headerGrid} style={{ height: headersHeight }}>
            {request.headers.map((header) => (
              <div className={headersStyles.headerRow} key={header.id}>
                <span>{header.key}</span>
                <span>{header.value}</span>
              </div>
            ))}
          </div>
        ) : (
          <p>No headers.</p>
        )}
        <div
          className={headersStyles.resizeHandle}
          role="separator"
          aria-orientation="horizontal"
          aria-label="Resize request headers"
          onMouseDown={startHeadersResize}
        />
      </section>
      <RequesterRequestBody request={request} />
    </>
  );
};

const RequesterResponseContent = ({
  response,
  extractionRules
}: {
  response: RequesterResponseSnapshot;
  extractionRules: RequesterExtractionRule[];
}): React.JSX.Element => {
  const previewVariables = extractVariablesFromResponse(extractionRules, response);
  const { height: headersHeight, startResize: startHeadersResize } = useVerticalResize(
    120,
    72,
    280
  );

  return (
    <>
      {response.isBodyTruncated ? (
        <p className={contentStyles.errorText}>Response body preview was truncated at 1 MB.</p>
      ) : null}
      <section className={contentStyles.detail} aria-label="Response details">
        <div>
          <span>Content-Type</span>
          <strong>{response.contentType || '-'}</strong>
        </div>
        <div>
          <span>Preview</span>
          <strong>{response.previewType}</strong>
        </div>
        <div>
          <span>Truncated</span>
          <strong>{response.isBodyTruncated ? 'yes' : 'no'}</strong>
        </div>
      </section>
      <section className={headersStyles.headers} aria-label="Response headers">
        <h3>Headers</h3>
        {response.headers.length > 0 ? (
          <div className={headersStyles.headerGrid} style={{ height: headersHeight }}>
            {response.headers.map((header) => (
              <div className={headersStyles.headerRow} key={header.id}>
                <span>{header.key}</span>
                <span>{header.value}</span>
              </div>
            ))}
          </div>
        ) : (
          <p>No headers.</p>
        )}
        <div
          className={headersStyles.resizeHandle}
          role="separator"
          aria-orientation="horizontal"
          aria-label="Resize response headers"
          onMouseDown={startHeadersResize}
        />
      </section>
      <section className={headersStyles.extractionPreview} aria-label="Extraction preview">
        <h3>Extraction Preview</h3>
        {previewVariables.length > 0 ? (
          <div className={headersStyles.headerGrid}>
            {previewVariables.map((variable) => (
              <div className={headersStyles.headerRow} key={variable.key}>
                <span>{variable.key}</span>
                <span>{variable.value}</span>
              </div>
            ))}
          </div>
        ) : (
          <p>No extracted variables.</p>
        )}
      </section>
      <RequesterResponseBody response={response} />
    </>
  );
};

const RequesterResponseBody = ({
  response
}: {
  response: RequesterResponseSnapshot;
}): React.JSX.Element => {
  const [activeTab, setActiveTab] = useState<'code' | 'preview'>(
    response.previewType === 'html' ||
      response.previewType === 'image' ||
      response.previewType === 'pdf'
      ? 'preview'
      : 'code'
  );
  const { height: previewHeight, startResize } = useVerticalResize(260, 160, 640);
  const canShowCode =
    response.previewType === 'json' ||
    response.previewType === 'html' ||
    response.previewType === 'text';
  const canShowPreview =
    response.previewType === 'html' ||
    response.previewType === 'image' ||
    response.previewType === 'pdf';
  const visibleTab = canShowPreview && activeTab === 'preview' ? 'preview' : 'code';
  const language = getResponseLanguage(response);
  const highlightedBody = useMemo(
    () => highlightRequesterBody(response.bodyText, language),
    [language, response.bodyText]
  );

  return (
    <section className={contentStyles.viewer} aria-label="Response body">
      {canShowCode && canShowPreview ? (
        <div className={contentStyles.tabs} role="tablist" aria-label="Response body view">
          <button
            type="button"
            role="tab"
            aria-selected={visibleTab === 'preview'}
            className={visibleTab === 'preview' ? contentStyles.tabActive : contentStyles.tab}
            onClick={() => setActiveTab('preview')}
          >
            Preview
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={visibleTab === 'code'}
            className={visibleTab === 'code' ? contentStyles.tabActive : contentStyles.tab}
            onClick={() => setActiveTab('code')}
          >
            Code
          </button>
        </div>
      ) : null}
      <div className={contentStyles.viewerFrame} style={{ height: previewHeight }}>
        {visibleTab === 'preview' ? (
          <ResponsePreview response={response} />
        ) : response.previewType === 'binary' && !response.bodyText ? (
          <p className={contentStyles.emptyBody}>Binary response body cannot be previewed.</p>
        ) : (
          <pre className={`${contentStyles.body} hljs`}>
            <code
              className={`${language ? `language-${language}` : undefined} ${contentStyles.code}`}
              dangerouslySetInnerHTML={{ __html: highlightedBody }}
            />
          </pre>
        )}
      </div>
      <div
        className={contentStyles.resizeHandle}
        role="separator"
        aria-orientation="horizontal"
        aria-label="Resize response preview"
        onMouseDown={startResize}
      />
    </section>
  );
};

const RequesterRequestBody = ({
  request
}: {
  request: RequesterRequestSnapshot;
}): React.JSX.Element => {
  const { height: previewHeight, startResize } = useVerticalResize(220, 120, 520);
  const language = getRequestLanguage(request);
  const highlightedBody = useMemo(
    () => highlightRequesterBody(request.bodyText, language),
    [language, request.bodyText]
  );

  return (
    <section className={contentStyles.viewer} aria-label="Request body">
      <div className={contentStyles.viewerFrame} style={{ height: previewHeight }}>
        {request.previewType === 'binary' || !request.bodyText ? (
          <p className={contentStyles.emptyBody}>
            {request.previewType === 'binary'
              ? 'Binary request body cannot be previewed.'
              : 'No request body.'}
          </p>
        ) : (
          <pre className={`${contentStyles.body} hljs`}>
            <code
              className={language ? `language-${language}` : undefined}
              dangerouslySetInnerHTML={{ __html: highlightedBody }}
            />
          </pre>
        )}
      </div>
      <div
        className={contentStyles.resizeHandle}
        role="separator"
        aria-orientation="horizontal"
        aria-label="Resize request preview"
        onMouseDown={startResize}
      />
    </section>
  );
};

const ResponsePreview = ({
  response
}: {
  response: RequesterResponseSnapshot;
}): React.JSX.Element => {
  if (response.previewType === 'html') {
    return (
      <iframe
        className={contentStyles.htmlPreview}
        title="HTML response preview"
        sandbox=""
        srcDoc={response.bodyText}
      />
    );
  }
  if (response.previewType === 'image') {
    return (
      <img
        className={contentStyles.image}
        alt="Response preview"
        src={`data:${response.contentType};base64,${response.bodyBase64}`}
      />
    );
  }
  if (response.previewType === 'pdf') {
    return (
      <iframe
        className={contentStyles.pdf}
        title="PDF response preview"
        src={`data:application/pdf;base64,${response.bodyBase64}`}
      />
    );
  }
  return <p className={contentStyles.emptyBody}>No preview available.</p>;
};
