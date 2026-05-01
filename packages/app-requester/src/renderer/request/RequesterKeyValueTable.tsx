import type { RequesterKeyValueRow } from '@tnet/app-requester/shared/requesterTypes';
import { createEmptyRow, updateKeyValueRow } from './requesterAppHelpers';

interface RequesterKeyValueTableProps {
  label: string;
  rows: RequesterKeyValueRow[];
  onChange: (rows: RequesterKeyValueRow[]) => void;
}

export const RequesterKeyValueTable = ({
  label,
  rows,
  onChange
}: RequesterKeyValueTableProps): React.JSX.Element => (
  <section className="requester-kv-section" aria-label={label}>
    <header>
      <h2>{label}</h2>
      <button
        type="button"
        className="open-folder-button"
        onClick={() => onChange([...rows, createEmptyRow()])}
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
              onChange(updateKeyValueRow(rows, row.id, { enabled: event.target.checked }))
            }
          />
          <input
            aria-label={`${label} key`}
            placeholder="Key"
            value={row.key}
            onChange={(event) =>
              onChange(updateKeyValueRow(rows, row.id, { key: event.target.value }))
            }
          />
          <input
            aria-label={`${label} value`}
            placeholder="Value"
            value={row.value}
            onChange={(event) =>
              onChange(updateKeyValueRow(rows, row.id, { value: event.target.value }))
            }
          />
          <button
            type="button"
            className="sidebar-icon-button material-icons-round"
            aria-label={`Remove ${label} row`}
            onClick={() => onChange(rows.filter((item) => item.id !== row.id))}
          >
            close
          </button>
        </div>
      ))}
      {rows.length === 0 ? <p className="empty-list-message">No rows.</p> : null}
    </div>
  </section>
);
