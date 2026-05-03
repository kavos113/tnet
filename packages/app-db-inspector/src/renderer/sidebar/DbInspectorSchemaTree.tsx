import type {
  DatabaseSchemaSnapshot,
  DatabaseTable
} from '@tnet/app-db-inspector/shared/dbInspectorTypes';
import styles from './DbInspectorSidebarTree.module.css';

interface DbInspectorSchemaTreeProps {
  schema?: DatabaseSchemaSnapshot;
  activeTableName?: string;
  onOpenTable: (table: DatabaseTable, page: number) => void;
}

export const DbInspectorSchemaTree = ({
  activeTableName,
  onOpenTable,
  schema
}: DbInspectorSchemaTreeProps): React.JSX.Element => (
  <div className={styles.schemaTree} role="tree" aria-label="Database objects">
    {schema?.schemas.map((databaseSchema) => (
      <div key={databaseSchema.name} className={styles.schemaGroup}>
        <div className={styles.schemaName}>
          <span className="material-icons">account_tree</span>
          {databaseSchema.name}
        </div>
        <div className={styles.treeBranch}>
          <div className={styles.treeFolder}>
            <span className="material-icons">folder</span>
            Tables
          </div>
          {databaseSchema.tables.map((table) => (
            <button
              key={table.name}
              className={`${styles.treeButton} ${
                activeTableName === table.name ? styles.treeButtonActive : ''
              }`}
              type="button"
              role="treeitem"
              onClick={() => onOpenTable(table, 0)}
            >
              <span className="material-icons">table_chart</span>
              <span className={styles.treeLabel}>{table.name}</span>
            </button>
          ))}
        </div>
        {databaseSchema.views.length > 0 ? (
          <div className={styles.treeBranch}>
            <div className={styles.treeFolder}>
              <span className="material-icons">folder</span>
              Views
            </div>
            {databaseSchema.views.map((view) => (
              <div key={view.name} className={styles.treeItem}>
                <span className="material-icons">view_list</span>
                <span className={styles.treeLabel}>{view.name}</span>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    ))}
  </div>
);
