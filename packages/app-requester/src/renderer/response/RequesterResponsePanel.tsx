import type {
  RequesterExecutionErrorSnapshot,
  RequesterExtractionRule,
  RequesterHistoryEntry,
  RequesterResponseSnapshot
} from '@tnet/app-requester/shared/requesterTypes';
import { extractVariablesFromResponse } from '@tnet/app-requester/shared/responseExtraction';
import contentStyles from './RequesterResponseContent.module.css';
import headersStyles from './RequesterResponseHeaders.module.css';
import historyStyles from './RequesterResponseHistory.module.css';
import styles from './RequesterResponsePanel.module.css';

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
      <RequesterResponseContent response={response} extractionRules={extractionRules} />
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

const RequesterResponseContent = ({
  response,
  extractionRules
}: {
  response: RequesterResponseSnapshot;
  extractionRules: RequesterExtractionRule[];
}): React.JSX.Element => {
  const previewVariables = extractVariablesFromResponse(extractionRules, response);

  return (
    <>
      <dl className={contentStyles.summary}>
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
          <div className={headersStyles.headerGrid}>
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
      {response.previewType === 'image' ? (
        <img
          className={contentStyles.image}
          alt="Response preview"
          src={`data:${response.contentType};base64,${response.bodyBase64}`}
        />
      ) : response.previewType === 'pdf' ? (
        <iframe
          className={contentStyles.pdf}
          title="PDF response preview"
          src={`data:application/pdf;base64,${response.bodyBase64}`}
        />
      ) : (
        <pre className={contentStyles.body}>{response.bodyText}</pre>
      )}
    </>
  );
};
