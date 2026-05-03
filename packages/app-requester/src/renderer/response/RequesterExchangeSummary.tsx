import type {
  RequesterRequestSnapshot,
  RequesterResponseSnapshot
} from '@tnet/app-requester/shared/requesterTypes';
import contentStyles from './RequesterResponseContent.module.css';

export const RequesterExchangeSummary = ({
  request,
  response
}: {
  request?: RequesterRequestSnapshot;
  response: RequesterResponseSnapshot;
}): React.JSX.Element => (
  <dl className={contentStyles.summary}>
    <div>
      <dt>Method</dt>
      <dd>{request?.method ?? '-'}</dd>
    </div>
    <div>
      <dt>Status</dt>
      <dd>
        {response.status} {response.statusText}
      </dd>
    </div>
    <div>
      <dt>Request MIME</dt>
      <dd>{request?.contentType || '-'}</dd>
    </div>
    <div>
      <dt>Response MIME</dt>
      <dd>{response.contentType || '-'}</dd>
    </div>
    <div>
      <dt>Time</dt>
      <dd>{response.durationMs} ms</dd>
    </div>
    <div>
      <dt>Response Size</dt>
      <dd>{response.byteSize} bytes</dd>
    </div>
    <div className={contentStyles.summaryWide}>
      <dt>URL</dt>
      <dd>{request?.executedUrl ?? '-'}</dd>
    </div>
  </dl>
);
