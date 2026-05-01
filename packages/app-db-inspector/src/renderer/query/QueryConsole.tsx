import { useEffect, useMemo, useState } from 'react';
import type { QueryExecutionResult } from '@tnet/app-db-inspector/shared/dbInspectorTypes';
import { isMutatingSql } from '@tnet/app-db-inspector/shared/sqlModel';
import { executeDbInspectorQuery, saveDbInspectorQueryTab } from '../dbInspectorActions';
import { useDbInspectorDispatch, useDbInspectorSelector } from '../storeHooks';
import { SqlEditor } from './SqlEditor';
import styles from '../DbInspectorApp.module.css';

export const QueryConsole = (): React.JSX.Element => {
  const dispatch = useDbInspectorDispatch();
  const {
    activeQueryTabId,
    activeWorkspaceId,
    globalSettings,
    isLoading,
    queryError,
    queryHistory,
    queryResult,
    queryTabs,
    settings
  } = useDbInspectorSelector((state) => state.dbInspector);
  const activeTab = useMemo(
    () => queryTabs.find((tab) => tab.id === activeQueryTabId),
    [activeQueryTabId, queryTabs]
  );
  const [sqlText, setSqlText] = useState(activeTab?.sqlText ?? 'SELECT * FROM ');
  const [title, setTitle] = useState(activeTab?.title ?? 'Query');
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    setSqlText(activeTab?.sqlText ?? 'SELECT * FROM ');
    setTitle(activeTab?.title ?? 'Query');
  }, [activeTab]);

  const execute = (): void => {
    if (settings.readOnlyMode && isMutatingSql(sqlText)) {
      window.alert('Read-only mode rejects mutating SQL statements.');
      return;
    }
    if (!settings.readOnlyMode && isMutatingSql(sqlText)) {
      const confirmed = window.confirm('This SQL may modify the database. Execute it?');
      if (!confirmed) return;
    }
    void executeDbInspectorQuery(dispatch, {
      workspaceId: activeWorkspaceId,
      sqlText,
      maxRows: globalSettings.defaultPageSize || 500
    });
  };

  const saveTab = (): void => {
    void saveDbInspectorQueryTab(dispatch, {
      id: activeTab?.id,
      workspaceId: activeWorkspaceId,
      title,
      sqlText
    });
  };

  return (
    <section
      className={`${styles.queryConsole} ${isExpanded ? styles.queryConsoleExpanded : ''}`}
      aria-label="SQL query console"
    >
      <div className={styles.queryHeader}>
        <div className={styles.queryTitleRow}>
          <input
            className={styles.input}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            aria-label="Query tab title"
          />
          <button
            className={styles.button}
            type="button"
            disabled={!activeWorkspaceId}
            onClick={saveTab}
          >
            Save Query
          </button>
          <button
            className={styles.button}
            type="button"
            disabled={!activeWorkspaceId || isLoading}
            onClick={execute}
          >
            Execute
          </button>
          <button
            className={styles.iconButton}
            type="button"
            aria-label={isExpanded ? 'Collapse SQL editor' : 'Expand SQL editor'}
            title={isExpanded ? 'Collapse SQL editor' : 'Expand SQL editor'}
            onClick={() => setIsExpanded((current) => !current)}
          >
            <span className="material-icons">{isExpanded ? 'unfold_less' : 'unfold_more'}</span>
          </button>
        </div>
        <span className={styles.queryMeta}>
          {queryResult
            ? `${queryResult.rows.length} rows - ${queryResult.durationMs} ms${
                queryResult.truncated ? ' - truncated' : ''
              }`
            : 'Ready'}
        </span>
      </div>
      {isExpanded ? (
        <div className={styles.queryBody}>
          <div className={styles.queryEditorPane}>
            <SqlEditor
              value={sqlText}
              onChange={setSqlText}
              queryFontFamily={globalSettings.queryFontFamily}
              queryFontSize={globalSettings.queryFontSize}
              minHeight={150}
            />
          </div>
          <div className={styles.queryResultPane}>
            {queryError ? <div className={styles.error}>{queryError}</div> : null}
            {queryResult ? <QueryResultTable result={queryResult} /> : null}
          </div>
          <aside className={styles.queryHistoryPane} aria-label="Query history">
            <strong>History</strong>
            {queryHistory.length === 0 ? (
              <span className={styles.mutedText}>No query history.</span>
            ) : (
              queryHistory.slice(0, 20).map((entry) => (
                <button
                  key={entry.id}
                  className={styles.historyButton}
                  type="button"
                  title={entry.sqlText}
                  onClick={() => setSqlText(entry.sqlText)}
                >
                  <span>{entry.sqlText}</span>
                  <small>
                    {entry.errorMessage
                      ? 'failed'
                      : `${entry.rowCount} rows - ${entry.durationMs} ms`}
                  </small>
                </button>
              ))
            )}
          </aside>
        </div>
      ) : (
        <div className={styles.queryCollapsedEditor}>
          <SqlEditor
            value={sqlText}
            onChange={setSqlText}
            queryFontFamily={globalSettings.queryFontFamily}
            queryFontSize={globalSettings.queryFontSize}
            minHeight={28}
          />
        </div>
      )}
    </section>
  );
};

const QueryResultTable = ({ result }: { result: QueryExecutionResult }): React.JSX.Element => {
  if (result.affectedRows !== undefined) {
    return <div className={styles.empty}>{result.affectedRows} rows affected.</div>;
  }

  if (result.columns.length === 0) {
    return <div className={styles.empty}>Query executed.</div>;
  }

  return (
    <div className={styles.tableWrapper}>
      <table className={styles.dataTable}>
        <thead>
          <tr>
            {result.columns.map((column) => (
              <th key={column.name}>{column.name}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {result.rows.map((row, index) => (
            <tr key={index}>
              {result.columns.map((column) => (
                <td key={column.name}>{formatCell(row[column.name])}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const formatCell = (value: unknown): string => {
  if (value === null) return 'NULL';
  if (value === undefined) return '';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
};
