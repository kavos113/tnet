import { buildErDiagramGraph } from '@tnet/app-db-inspector/shared/erDiagram';
import type { DatabaseSchemaSnapshot } from '@tnet/app-db-inspector/shared/dbInspectorTypes';
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
  const graph = buildErDiagramGraph(schema, { schemaName, tableName, maxNodes: 60 });
  const nodeNameById = new Map(
    graph.nodes.map((node) => [
      node.id,
      node.schemaName ? `${node.schemaName}.${node.tableName}` : node.tableName
    ])
  );

  return (
    <section className={styles.erView} aria-label="Entity relationship diagram">
      {graph.truncated ? (
        <div className={styles.warning}>
          Large schema detected. Showing the first {graph.nodes.length} tables.
        </div>
      ) : null}
      {graph.nodes.length === 0 ? (
        <div className={styles.empty}>No tables are available for the ER view.</div>
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
