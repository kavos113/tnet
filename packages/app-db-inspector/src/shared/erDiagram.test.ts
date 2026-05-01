import { describe, expect, it } from 'vitest';
import type { DatabaseSchemaSnapshot } from './dbInspectorTypes';
import { buildErDiagramGraph, buildMermaidErDiagram } from './erDiagram';

const snapshot: DatabaseSchemaSnapshot = {
  refreshedAt: '2026-01-01T00:00:00.000Z',
  schemas: [
    {
      name: 'main',
      views: [],
      tables: [
        {
          schemaName: 'main',
          name: 'authors',
          columns: [
            { name: 'id', type: 'INTEGER', nullable: false },
            { name: 'name', type: 'TEXT', nullable: false }
          ],
          primaryKey: ['id'],
          foreignKeys: [],
          indexes: []
        },
        {
          schemaName: 'main',
          name: 'papers',
          columns: [
            { name: 'id', type: 'INTEGER', nullable: false },
            { name: 'author_id', type: 'INTEGER', nullable: false }
          ],
          primaryKey: ['id'],
          foreignKeys: [
            {
              columns: ['author_id'],
              referencedTableName: 'authors',
              referencedColumns: ['id']
            }
          ],
          indexes: []
        }
      ]
    }
  ]
};

describe('erDiagram', () => {
  it('builds nodes and foreign key edges from schema snapshot', () => {
    const graph = buildErDiagramGraph(snapshot);

    expect(graph.nodes.map((node) => node.id)).toEqual(['main.authors', 'main.papers']);
    expect(graph.nodes[1].columns.find((column) => column.name === 'author_id')).toMatchObject({
      foreignKey: true
    });
    expect(graph.edges).toEqual([
      {
        id: 'main.papers:author_id->main.authors:id',
        fromTableId: 'main.papers',
        toTableId: 'main.authors',
        columns: ['author_id'],
        referencedColumns: ['id']
      }
    ]);
  });

  it('can build a selected table neighborhood graph', () => {
    const graph = buildErDiagramGraph(snapshot, { tableName: 'papers' });
    expect(graph.nodes.map((node) => node.tableName)).toEqual(['authors', 'papers']);
  });

  it('builds a mermaid erDiagram from the graph', () => {
    const mermaid = buildMermaidErDiagram(buildErDiagramGraph(snapshot));

    expect(mermaid).toContain('erDiagram');
    expect(mermaid).toContain('main__authors {');
    expect(mermaid).toContain('INTEGER id PK "NOT NULL"');
    expect(mermaid).toContain('main__papers }o--|| main__authors : "author_id to id"');
  });
});
