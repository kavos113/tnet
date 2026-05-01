import type {
  RequesterExecutionErrorSnapshot,
  RequesterExtractionRule,
  RequesterHistoryEntry,
  RequesterResponseSnapshot
} from '@tnet/app-requester/shared/requesterTypes';
import { extractVariablesFromResponse } from '@tnet/app-requester/shared/responseExtraction';
import sharedStyles from '../RequesterShared.module.css';
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
    <h2>Response</h2>
    {error ? (
      <section className={styles.error} aria-label="Response error details">
        <h3>Request failed</h3>
        <dl className={styles.summary}>
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
        {error.stack ? <pre className={styles.body}>{error.stack}</pre> : null}
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
    <section className={styles.history} aria-label="Request history">
      <h3>History</h3>
      {history.slice(0, 5).map((entry) => (
        <button
          type="button"
          className={`${styles.historyRow} ${
            entry.id === selectedHistoryId ? styles.historyRowSelected : ''
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
      <dl className={styles.summary}>
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
      <div className={styles.actions}>
        <button type="button" className={sharedStyles.openButton} onClick={onSaveResponse}>
          Save Body
        </button>
        <button type="button" className={sharedStyles.openButton} onClick={onOpenResponse}>
          Open
        </button>
      </div>
      {response.isBodyTruncated ? (
        <p className={styles.errorText}>Response body preview was truncated at 1 MB.</p>
      ) : null}
      <section className={styles.detail} aria-label="Response details">
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
      <section className={styles.headers} aria-label="Response headers">
        <h3>Headers</h3>
        {response.headers.length > 0 ? (
          <div className={styles.headerGrid}>
            {response.headers.map((header) => (
              <div className={styles.headerRow} key={header.id}>
                <span>{header.key}</span>
                <span>{header.value}</span>
              </div>
            ))}
          </div>
        ) : (
          <p>No headers.</p>
        )}
      </section>
      <section className={styles.extractionPreview} aria-label="Extraction preview">
        <h3>Extraction Preview</h3>
        {previewVariables.length > 0 ? (
          <div className={styles.headerGrid}>
            {previewVariables.map((variable) => (
              <div className={styles.headerRow} key={variable.key}>
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
          className={styles.image}
          alt="Response preview"
          src={`data:${response.contentType};base64,${response.bodyBase64}`}
        />
      ) : response.previewType === 'pdf' ? (
        <iframe
          className={styles.pdf}
          title="PDF response preview"
          src={`data:application/pdf;base64,${response.bodyBase64}`}
        />
      ) : (
        <pre className={styles.body}>{response.bodyText}</pre>
      )}
    </>
  );
};
