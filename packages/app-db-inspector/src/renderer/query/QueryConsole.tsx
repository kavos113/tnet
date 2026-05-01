import { useEffect, useMemo, useState } from 'react';
import type {
  DbInspectorDriverType,
  ExplainPlanNode,
  ExplainQueryResult,
  QueryExecutionResult
} from '@tnet/app-db-inspector/shared/dbInspectorTypes';
import { isMutatingSql } from '@tnet/app-db-inspector/shared/sqlModel';
import {
  cancelDbInspectorQuery,
  explainDbInspectorQuery,
  executeDbInspectorQuery,
  saveDbInspectorQueryTab
} from '../dbInspectorActions';
import {
  exportRowsAsCsv,
  exportRowsAsInsertSql,
  safeExportFileName
} from '../exportDbInspectorData';
import { useDbInspectorDispatch, useDbInspectorSelector } from '../storeHooks';
import { SqlEditor } from './SqlEditor';
import { createSqlCompletionSource } from './sqlCompletion';
import appStyles from '../DbInspectorApp.module.css';
import styles from './QueryConsole.module.css';

export const QueryConsole = (): React.JSX.Element => {
  const dispatch = useDbInspectorDispatch();
  const {
    activeQueryTabId,
    activeTableName,
    activeWorkspaceId,
    globalSettings,
    isLoading,
    queryError,
    queryHistory,
    queryResult,
    explainResult,
    schema,
    queryTabs,
    workspaces,
    settings
  } = useDbInspectorSelector((state) => state.dbInspector);
  const activeTab = useMemo(
    () => queryTabs.find((tab) => tab.id === activeQueryTabId),
    [activeQueryTabId, queryTabs]
  );
  const [sqlText, setSqlText] = useState(activeTab?.sqlText ?? 'SELECT * FROM ');
  const [title, setTitle] = useState(activeTab?.title ?? 'Query');
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeResultTab, setActiveResultTab] = useState<'result' | 'plan'>('result');
  const activeWorkspace = useMemo(
    () => workspaces.find((workspace) => workspace.id === activeWorkspaceId),
    [activeWorkspaceId, workspaces]
  );
  const sqlCompletionSource = useMemo(
    () =>
      createSqlCompletionSource({
        dialect: activeWorkspace?.driver ?? 'sqlite',
        schema
      }),
    [activeWorkspace?.driver, schema]
  );

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
    setActiveResultTab('result');
  };

  const explain = (): void => {
    void explainDbInspectorQuery(dispatch, {
      workspaceId: activeWorkspaceId,
      sqlText
    }).then((result) => {
      if (result) setActiveResultTab('plan');
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
            className={appStyles.input}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            aria-label="Query tab title"
          />
          <button
            className={appStyles.button}
            type="button"
            disabled={!activeWorkspaceId}
            onClick={saveTab}
          >
            Save Query
          </button>
          <button
            className={appStyles.button}
            type="button"
            disabled={!activeWorkspaceId || isLoading}
            onClick={execute}
          >
            Execute
          </button>
          <button
            className={appStyles.button}
            type="button"
            disabled={!activeWorkspaceId || isLoading}
            onClick={explain}
          >
            Explain
          </button>
          <button
            className={appStyles.button}
            type="button"
            disabled={!isLoading}
            onClick={() => cancelDbInspectorQuery(dispatch)}
          >
            Cancel
          </button>
          <button
            className={appStyles.iconButton}
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
              completionSource={sqlCompletionSource}
            />
          </div>
          <div className={styles.queryResultPane}>
            {queryError ? <div className={appStyles.error}>{queryError}</div> : null}
            {queryResult || explainResult ? (
              <QueryOutputPane
                activeTab={activeResultTab}
                defaultTableName={activeTableName}
                dialect={activeWorkspace?.driver ?? 'sqlite'}
                explainResult={explainResult}
                queryResult={queryResult}
                onSelectTab={setActiveResultTab}
              />
            ) : null}
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
            completionSource={sqlCompletionSource}
          />
        </div>
      )}
    </section>
  );
};

const QueryOutputPane = ({
  activeTab,
  defaultTableName,
  dialect,
  explainResult,
  queryResult,
  onSelectTab
}: {
  activeTab: 'result' | 'plan';
  defaultTableName?: string;
  dialect: DbInspectorDriverType;
  explainResult?: ExplainQueryResult;
  queryResult?: QueryExecutionResult;
  onSelectTab: (tab: 'result' | 'plan') => void;
}): React.JSX.Element => (
  <div className={styles.queryOutputPane}>
    <div className={appStyles.segmentedControl} aria-label="Query output">
      <button
        type="button"
        className={activeTab === 'result' ? appStyles.segmentedButtonActive : ''}
        disabled={!queryResult}
        onClick={() => onSelectTab('result')}
      >
        Result
      </button>
      <button
        type="button"
        className={activeTab === 'plan' ? appStyles.segmentedButtonActive : ''}
        disabled={!explainResult}
        onClick={() => onSelectTab('plan')}
      >
        Plan
      </button>
    </div>
    {activeTab === 'plan' && explainResult ? (
      <ExplainPlanView result={explainResult} />
    ) : queryResult ? (
      <QueryResultTable
        result={queryResult}
        dialect={dialect}
        defaultTableName={defaultTableName}
      />
    ) : null}
  </div>
);

const ExplainPlanView = ({ result }: { result: ExplainQueryResult }): React.JSX.Element => (
  <div className={styles.explainPlan}>
    <div className={styles.queryMeta}>Plan generated in {result.durationMs} ms</div>
    {result.nodes.length > 0 ? (
      <ul className={styles.planTree}>
        {result.nodes.map((node) => (
          <ExplainPlanNodeView key={node.id} node={node} />
        ))}
      </ul>
    ) : null}
    {result.rawJson !== undefined ? (
      <pre className={styles.planRaw}>{JSON.stringify(result.rawJson, null, 2)}</pre>
    ) : result.rawText ? (
      <pre className={styles.planRaw}>{result.rawText}</pre>
    ) : null}
  </div>
);

const ExplainPlanNodeView = ({ node }: { node: ExplainPlanNode }): React.JSX.Element => (
  <li>
    <div className={styles.planNode}>
      <strong>{node.label}</strong>
      {node.detail ? <span>{node.detail}</span> : null}
      {node.cost ? <span>cost: {node.cost}</span> : null}
      {node.rows ? <span>rows: {node.rows}</span> : null}
    </div>
    {node.children && node.children.length > 0 ? (
      <ul>
        {node.children.map((child) => (
          <ExplainPlanNodeView key={child.id} node={child} />
        ))}
      </ul>
    ) : null}
  </li>
);

const QueryResultTable = ({
  defaultTableName,
  dialect,
  result
}: {
  defaultTableName?: string;
  dialect: DbInspectorDriverType;
  result: QueryExecutionResult;
}): React.JSX.Element => {
  if (result.affectedRows !== undefined) {
    return <div className={appStyles.empty}>{result.affectedRows} rows affected.</div>;
  }

  if (result.columns.length === 0) {
    return <div className={appStyles.empty}>Query executed.</div>;
  }

  const exportCsv = (): void => {
    void exportRowsAsCsv({
      columns: result.columns,
      rows: result.rows,
      defaultPath: safeExportFileName(defaultTableName ?? 'query-result', 'csv')
    });
  };

  const exportInsert = (): void => {
    const tableName = defaultTableName ?? window.prompt('Table name for INSERT export');
    if (!tableName) return;
    void exportRowsAsInsertSql({
      columns: result.columns,
      rows: result.rows,
      dialect,
      tableName,
      defaultPath: safeExportFileName(`${tableName}-insert`, 'sql')
    });
  };

  return (
    <div className={styles.queryResultTableShell}>
      <div className={styles.queryResultToolbar}>
        <button className={appStyles.button} type="button" onClick={exportCsv}>
          Export CSV
        </button>
        <button className={appStyles.button} type="button" onClick={exportInsert}>
          Export INSERT
        </button>
      </div>
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
    </div>
  );
};

const formatCell = (value: unknown): string => {
  if (value === null) return 'NULL';
  if (value === undefined) return '';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
};
