import type {
  DatabaseTable,
  TablePageResult
} from '@tnet/app-db-inspector/shared/dbInspectorTypes';
import styles from '../DbInspectorApp.module.css';

interface DbInspectorTableGridProps {
  activeTableName?: string;
  activeTable: TablePageResult;
  activeTableModel?: DatabaseTable;
  previewSql: string;
  page: number;
  sort?: {
    column: string;
    direction: 'asc' | 'desc';
  };
  isLoading: boolean;
  onPreviewSqlChange: (sql: string) => void;
  onSortChange: (sort: { column: string; direction: 'asc' | 'desc' } | undefined) => void;
  onOpenTable: (table: DatabaseTable, page: number) => void;
}

export const DbInspectorTableGrid = ({
  activeTable,
  activeTableModel,
  activeTableName,
  isLoading,
  onPreviewSqlChange,
  onSortChange,
  onOpenTable,
  page,
  previewSql,
  sort
}: DbInspectorTableGridProps): React.JSX.Element => (
  <div className={styles.tableShell}>
    <div className={styles.tableToolbar}>
      <strong>{activeTableName}</strong>
      <input
        className={`${styles.input} ${styles.previewSqlInput}`}
        value={previewSql}
        onChange={(event) => onPreviewSqlChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && activeTableModel && !isLoading) {
            onOpenTable(activeTableModel, 0);
          }
        }}
        aria-label="Table preview SQL"
        placeholder="SELECT * FROM table"
      />
      <button
        className={styles.button}
        type="button"
        disabled={!activeTableModel || isLoading}
        onClick={() => activeTableModel && onOpenTable(activeTableModel, 0)}
      >
        Apply
      </button>
      <span>{activeTable.totalRows} rows</span>
    </div>
    <div className={styles.tableWrapper}>
      <table className={styles.dataTable}>
        <thead>
          <tr>
            {activeTable.columns.map((column) => {
              const nextDirection =
                sort?.column === column.name && sort.direction === 'asc' ? 'desc' : 'asc';
              return (
                <th key={column.name}>
                  <button
                    className={styles.columnSortButton}
                    type="button"
                    onClick={() => {
                      onSortChange({ column: column.name, direction: nextDirection });
                    }}
                  >
                    {column.name}
                    {sort?.column === column.name ? (
                      <span className="material-icons">
                        {sort.direction === 'asc' ? 'arrow_upward' : 'arrow_downward'}
                      </span>
                    ) : null}
                  </button>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {activeTable.rows.map((row, index) => (
            <tr key={index}>
              {activeTable.columns.map((column) => (
                <td key={column.name}>{formatCell(row[column.name])}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    <div className={styles.pagingRow}>
      <button
        className={styles.button}
        type="button"
        disabled={!activeTableModel || page === 0 || isLoading}
        onClick={() => activeTableModel && onOpenTable(activeTableModel, page - 1)}
      >
        Previous
      </button>
      <span>Page {page + 1}</span>
      <button
        className={styles.button}
        type="button"
        disabled={
          !activeTableModel ||
          isLoading ||
          (page + 1) * activeTable.pageSize >= activeTable.totalRows
        }
        onClick={() => activeTableModel && onOpenTable(activeTableModel, page + 1)}
      >
        Next
      </button>
    </div>
  </div>
);

const formatCell = (value: unknown): string => {
  if (value === null) return 'NULL';
  if (value === undefined) return '';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
};
