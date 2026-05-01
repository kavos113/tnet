import type {
  RequesterExecutionErrorSnapshot,
  RequesterExtractionRule,
  RequesterHistoryEntry,
  RequesterResponseSnapshot
} from '@tnet/app-requester/shared/requesterTypes';
import { extractVariablesFromResponse } from '@tnet/app-requester/shared/responseExtraction';

interface RequesterResponsePanelProps {
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
  response,
  error,
  extractionRules,
  history,
  selectedHistoryId,
  onSaveResponse,
  onOpenResponse,
  onSelectHistory
}: RequesterResponsePanelProps): React.JSX.Element => (
  <section className="requester-response-placeholder" aria-label="API response">
    <h2>Response</h2>
    {error ? (
      <section className="requester-response-error" aria-label="Response error details">
        <h3>Request failed</h3>
        <dl className="requester-response-summary">
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
        {error.stack ? <pre className="requester-response-body">{error.stack}</pre> : null}
      </section>
    ) : response ? (
      <RequesterResponseContent
        response={response}
        extractionRules={extractionRules}
        onSaveResponse={onSaveResponse}
        onOpenResponse={onOpenResponse}
      />
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

const RequesterResponseContent = ({
  response,
  extractionRules,
  onSaveResponse,
  onOpenResponse
}: {
  response: RequesterResponseSnapshot;
  extractionRules: RequesterExtractionRule[];
  onSaveResponse: () => void;
  onOpenResponse: () => void;
}): React.JSX.Element => {
  const previewVariables = extractVariablesFromResponse(extractionRules, response);

  return (
    <>
      <dl className="requester-response-summary">
        <div>
          <dt>Status</dt>
          <dd>
            {response.status} {response.statusText}
          </dd>
        </div>
        <div>
          <dt>Time</dt>
          <dd>{response.durationMs} ms</dd>
        </div>
        <div>
          <dt>Size</dt>
          <dd>{response.byteSize} bytes</dd>
        </div>
      </dl>
      <div className="requester-response-actions">
        <button type="button" className="open-folder-button" onClick={onSaveResponse}>
          Save Body
        </button>
        <button type="button" className="open-folder-button" onClick={onOpenResponse}>
          Open
        </button>
      </div>
      {response.isBodyTruncated ? (
        <p className="requester-error">Response body preview was truncated at 1 MB.</p>
      ) : null}
      <section className="requester-response-detail" aria-label="Response details">
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
      <section className="requester-response-headers" aria-label="Response headers">
        <h3>Headers</h3>
        {response.headers.length > 0 ? (
          <div className="requester-response-header-grid">
            {response.headers.map((header) => (
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
      <section className="requester-extraction-preview" aria-label="Extraction preview">
        <h3>Extraction Preview</h3>
        {previewVariables.length > 0 ? (
          <div className="requester-response-header-grid">
            {previewVariables.map((variable) => (
              <div className="requester-response-header-row" key={variable.key}>
                <span>{variable.key}</span>
                <span>{variable.value}</span>
              </div>
            ))}
          </div>
        ) : (
          <p>No extracted variables.</p>
        )}
      </section>
      {response.previewType === 'image' ? (
        <img
          className="requester-response-image"
          alt="Response preview"
          src={`data:${response.contentType};base64,${response.bodyBase64}`}
        />
      ) : response.previewType === 'pdf' ? (
        <iframe
          className="requester-response-pdf"
          title="PDF response preview"
          src={`data:application/pdf;base64,${response.bodyBase64}`}
        />
      ) : (
        <pre className="requester-response-body">{response.bodyText}</pre>
      )}
    </>
  );
};
