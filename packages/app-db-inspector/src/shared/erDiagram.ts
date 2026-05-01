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
