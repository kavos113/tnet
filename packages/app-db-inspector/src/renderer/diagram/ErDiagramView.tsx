import { useMemo, useState } from 'react';
import {
  buildErDiagramGraph,
  buildMermaidErDiagram
} from '@tnet/app-db-inspector/shared/erDiagram';
import type { DatabaseSchemaSnapshot } from '@tnet/app-db-inspector/shared/dbInspectorTypes';
import { MermaidDiagramView } from './MermaidDiagramView';
import styles from '../DbInspectorApp.module.css';

interface ErDiagramViewProps {
  schema: DatabaseSchemaSnapshot;
  schemaName?: string;
  tableName?: string;
}

export const ErDiagramView = ({
  schema,
  schemaName,
  tableName
}: ErDiagramViewProps): React.JSX.Element => {
  const graph = useMemo(
    () => buildErDiagramGraph(schema, { schemaName, tableName, maxNodes: 60 }),
    [schema, schemaName, tableName]
  );
  const mermaidSource = useMemo(() => buildMermaidErDiagram(graph), [graph]);
  const [mode, setMode] = useState<'cards' | 'mermaid'>('cards');
  const nodeNameById = new Map(
    graph.nodes.map((node) => [
      node.id,
      node.schemaName ? `${node.schemaName}.${node.tableName}` : node.tableName
    ])
  );

  return (
    <section className={styles.erView} aria-label="Entity relationship diagram">
      <header className={styles.erToolbar}>
        <div className={styles.segmentedControl} aria-label="ER diagram renderer">
          <button
            className={mode === 'cards' ? styles.segmentedActive : ''}
            type="button"
            aria-pressed={mode === 'cards'}
            onClick={() => setMode('cards')}
          >
            Cards
          </button>
          <button
            className={mode === 'mermaid' ? styles.segmentedActive : ''}
            type="button"
            aria-pressed={mode === 'mermaid'}
            onClick={() => setMode('mermaid')}
          >
            Mermaid
          </button>
        </div>
      </header>
      {graph.truncated ? (
        <div className={styles.warning}>
          Large schema detected. Showing the first {graph.nodes.length} tables.
        </div>
      ) : null}
      {graph.nodes.length === 0 ? (
        <div className={styles.empty}>No tables are available for the ER view.</div>
      ) : mode === 'mermaid' ? (
        <MermaidDiagramView source={mermaidSource} />
      ) : (
        <div className={styles.erLayout}>
          <div className={styles.erNodeGrid}>
            {graph.nodes.map((node) => (
              <article key={node.id} className={styles.erNode}>
                <header className={styles.erNodeHeader}>
                  {node.schemaName ? <span>{node.schemaName}</span> : null}
                  <strong>{node.tableName}</strong>
                </header>
                <div className={styles.erColumnList}>
                  {node.columns.map((column) => (
                    <div key={column.name} className={styles.erColumn}>
                      <span>{column.name}</span>
                      <small>{column.type}</small>
                      {column.primaryKey ? <b>PK</b> : null}
                      {column.foreignKey ? <b>FK</b> : null}
                      {column.nullable ? <em>NULL</em> : null}
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
          <aside className={styles.erEdges} aria-label="Foreign key relationships">
            <strong>Relationships</strong>
            {graph.edges.length === 0 ? (
              <span className={styles.mutedText}>No foreign keys found.</span>
            ) : (
              graph.edges.map((edge) => (
                <div key={edge.id} className={styles.erEdge}>
                  <span>{nodeNameById.get(edge.fromTableId) ?? edge.fromTableId}</span>
                  <span className="material-icons">arrow_forward</span>
                  <span>{nodeNameById.get(edge.toTableId) ?? edge.toTableId}</span>
                  <small>
                    {edge.columns.join(', ')} to {edge.referencedColumns.join(', ')}
                  </small>
                </div>
              ))
            )}
          </aside>
        </div>
      )}
    </section>
  );
};
