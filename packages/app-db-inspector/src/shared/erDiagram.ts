import type { DatabaseSchemaSnapshot, DatabaseTable } from './dbInspectorTypes';

export interface ErDiagramGraph {
  nodes: ErDiagramNode[];
  edges: ErDiagramEdge[];
  truncated: boolean;
}

export interface ErDiagramNode {
  id: string;
  schemaName?: string;
  tableName: string;
  columns: ErDiagramColumn[];
}

export interface ErDiagramColumn {
  name: string;
  type: string;
  primaryKey: boolean;
  foreignKey: boolean;
  nullable: boolean;
}

export interface ErDiagramEdge {
  id: string;
  fromTableId: string;
  toTableId: string;
  columns: string[];
  referencedColumns: string[];
}

export const buildErDiagramGraph = (
  snapshot: DatabaseSchemaSnapshot,
  options: { schemaName?: string; tableName?: string; maxNodes?: number } = {}
): ErDiagramGraph => {
  const maxNodes = options.maxNodes ?? 80;
  const allTables = snapshot.schemas
    .filter((schema) => !options.schemaName || schema.name === options.schemaName)
    .flatMap((schema) => schema.tables);
  const includedTables = options.tableName
    ? relatedTables(allTables, options.tableName)
    : allTables;
  const limitedTables = includedTables.slice(0, maxNodes);
  const includedIds = new Set(limitedTables.map(tableId));

  return {
    nodes: limitedTables.map(toNode),
    edges: limitedTables.flatMap((table) =>
      table.foreignKeys
        .map((foreignKey) => {
          const toTableId = tableId({
            schemaName: foreignKey.referencedSchemaName ?? table.schemaName,
            name: foreignKey.referencedTableName
          });
          if (!includedIds.has(toTableId)) return undefined;
          return {
            id: `${tableId(table)}:${foreignKey.columns.join(',')}->${toTableId}:${foreignKey.referencedColumns.join(',')}`,
            fromTableId: tableId(table),
            toTableId,
            columns: foreignKey.columns,
            referencedColumns: foreignKey.referencedColumns
          };
        })
        .filter((edge): edge is ErDiagramEdge => Boolean(edge))
    ),
    truncated: includedTables.length > limitedTables.length
  };
};

export const buildMermaidErDiagram = (graph: ErDiagramGraph): string => {
  const lines = ['erDiagram'];
  graph.nodes.forEach((node) => {
    lines.push(`  ${mermaidEntityName(node.id)} {`);
    node.columns.forEach((column) => {
      const keyFlags = [column.primaryKey ? 'PK' : undefined, column.foreignKey ? 'FK' : undefined]
        .filter(Boolean)
        .join(',');
      const comment = column.nullable ? '' : ' "NOT NULL"';
      lines.push(
        `    ${mermaidToken(column.type || 'unknown')} ${mermaidToken(column.name)}${keyFlags ? ` ${keyFlags}` : ''}${comment}`
      );
    });
    lines.push('  }');
  });
  graph.edges.forEach((edge) => {
    lines.push(
      `  ${mermaidEntityName(edge.fromTableId)} }o--|| ${mermaidEntityName(edge.toTableId)} : "${mermaidLabel(edge.columns, edge.referencedColumns)}"`
    );
  });
  return lines.join('\n');
};

const relatedTables = (tables: DatabaseTable[], tableName: string): DatabaseTable[] => {
  const selected = tables.find((table) => table.name === tableName);
  if (!selected) return [];
  const selectedId = tableId(selected);
  const relatedIds = new Set<string>([selectedId]);
  selected.foreignKeys.forEach((foreignKey) => {
    relatedIds.add(
      tableId({
        schemaName: foreignKey.referencedSchemaName ?? selected.schemaName,
        name: foreignKey.referencedTableName
      })
    );
  });
  tables.forEach((table) => {
    if (
      table.foreignKeys.some(
        (foreignKey) =>
          tableId({
            schemaName: foreignKey.referencedSchemaName ?? table.schemaName,
            name: foreignKey.referencedTableName
          }) === selectedId
      )
    ) {
      relatedIds.add(tableId(table));
    }
  });
  return tables.filter((table) => relatedIds.has(tableId(table)));
};

const toNode = (table: DatabaseTable): ErDiagramNode => {
  const foreignKeyColumns = new Set(table.foreignKeys.flatMap((foreignKey) => foreignKey.columns));
  return {
    id: tableId(table),
    schemaName: table.schemaName,
    tableName: table.name,
    columns: table.columns.map((column) => ({
      name: column.name,
      type: column.type,
      primaryKey: table.primaryKey.includes(column.name),
      foreignKey: foreignKeyColumns.has(column.name),
      nullable: column.nullable
    }))
  };
};

const tableId = (table: { schemaName?: string; name: string }): string =>
  `${table.schemaName ?? 'main'}.${table.name}`;

const mermaidEntityName = (value: string): string => mermaidToken(value.replace(/\./g, '__'));

const mermaidToken = (value: string): string => {
  const normalized = value.trim().replace(/[^A-Za-z0-9_]/g, '_');
  return normalized && /^[A-Za-z_]/.test(normalized) ? normalized : `_${normalized || 'value'}`;
};

const mermaidLabel = (columns: string[], referencedColumns: string[]): string =>
  `${columns.join(', ')} to ${referencedColumns.join(', ')}`.replace(/"/g, '\\"');
