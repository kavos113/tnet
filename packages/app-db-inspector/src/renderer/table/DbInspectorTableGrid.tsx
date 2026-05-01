import type {
  DatabaseTable,
  TablePageResult
} from '@tnet/app-db-inspector/shared/dbInspectorTypes';
import { formatExportValue, rowsToCsv, rowToTsv } from '@tnet/app-db-inspector/shared/tableExport';
import { useState } from 'react';
import appStyles from '../DbInspectorApp.module.css';
import styles from './DbInspectorTableGrid.module.css';

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
  onExportCsv: () => void;
  onExportInsert: () => void;
}

export const DbInspectorTableGrid = ({
  activeTable,
  activeTableModel,
  activeTableName,
  isLoading,
  onExportCsv,
  onExportInsert,
  onPreviewSqlChange,
  onSortChange,
  onOpenTable,
  page,
  previewSql,
  sort
}: DbInspectorTableGridProps): React.JSX.Element => {
  const [selectedCell, setSelectedCell] = useState<
    { rowIndex: number; columnName: string } | undefined
  >();
  const selectedRow =
    selectedCell?.rowIndex !== undefined ? activeTable.rows[selectedCell.rowIndex] : undefined;

  const copySelectedCell = (): void => {
    if (!selectedCell) return;
    const row = activeTable.rows[selectedCell.rowIndex];
    void writeClipboard(formatExportValue(row?.[selectedCell.columnName]));
  };

  const copySelectedRow = (): void => {
    if (!selectedRow) return;
    void writeClipboard(rowToTsv(activeTable.columns, selectedRow));
  };

  const copyCsv = (): void => {
    void writeClipboard(rowsToCsv(activeTable.columns, activeTable.rows));
  };

  return (
    <div className={styles.tableShell}>
      <div className={styles.tableToolbar}>
        <strong>{activeTableName}</strong>
        <input
          className={`${appStyles.input} ${styles.previewSqlInput}`}
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
          className={appStyles.button}
          type="button"
          disabled={!activeTableModel || isLoading}
          onClick={() => activeTableModel && onOpenTable(activeTableModel, 0)}
        >
          Apply
        </button>
        <button
          className={appStyles.iconButton}
          type="button"
          title="Copy cell"
          disabled={!selectedCell}
          onClick={copySelectedCell}
        >
          <span className="material-icons">content_copy</span>
        </button>
        <button
          className={appStyles.iconButton}
          type="button"
          title="Copy row"
          disabled={!selectedRow}
          onClick={copySelectedRow}
        >
          <span className="material-icons">view_week</span>
        </button>
        <button
          className={appStyles.iconButton}
          type="button"
          title="Copy CSV"
          disabled={activeTable.rows.length === 0}
          onClick={copyCsv}
        >
          <span className="material-icons">csv</span>
        </button>
        <button
          className={appStyles.button}
          type="button"
          disabled={activeTable.totalRows === 0 || isLoading}
          onClick={onExportCsv}
        >
          Export CSV
        </button>
        <button
          className={appStyles.button}
          type="button"
          disabled={!activeTableModel || activeTable.totalRows === 0 || isLoading}
          onClick={onExportInsert}
        >
          Export INSERT
        </button>
        <span>{activeTable.totalRows} rows</span>
      </div>
      <div className={styles.tableWrapper}>
        <table className={styles.dataTable}>
          <thead>
            <tr>
              <th className={styles.rowNumberHeader} aria-label="Row number">
                #
              </th>
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
            {activeTable.rows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                <th className={styles.rowNumberCell} scope="row">
                  {page * activeTable.pageSize + rowIndex + 1}
                </th>
                {activeTable.columns.map((column) => (
                  <td
                    key={column.name}
                    className={
                      selectedCell?.rowIndex === rowIndex && selectedCell.columnName === column.name
                        ? styles.selectedCell
                        : undefined
                    }
                    onClick={() => setSelectedCell({ rowIndex, columnName: column.name })}
                  >
                    {formatExportValue(row[column.name])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className={styles.pagingRow}>
        <button
          className={appStyles.button}
          type="button"
          disabled={!activeTableModel || page === 0 || isLoading}
          onClick={() => activeTableModel && onOpenTable(activeTableModel, page - 1)}
        >
          Previous
        </button>
        <span>Page {page + 1}</span>
        <button
          className={appStyles.button}
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
};

const writeClipboard = async (value: string): Promise<void> => {
  await navigator.clipboard.writeText(value);
};
