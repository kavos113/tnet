import { describe, expect, it } from 'vitest';
import {
  mysqlJsonPlanToNodes,
  postgresJsonPlanToNodes,
  sqliteExplainRowsToNodes
} from './explainPlanModel';

describe('explainPlanModel', () => {
  it('builds a tree from SQLite explain rows', () => {
    const nodes = sqliteExplainRowsToNodes([
      { id: 2, parent: 0, detail: 'SCAN authors' },
      { id: 5, parent: 2, detail: 'SEARCH papers USING INDEX idx_papers_author' }
    ]);

    expect(nodes).toMatchObject([
      {
        id: '2',
        label: 'SCAN authors',
        children: [{ id: '5', label: 'SEARCH papers USING INDEX idx_papers_author' }]
      }
    ]);
  });

  it('builds a compact PostgreSQL JSON plan tree', () => {
    const nodes = postgresJsonPlanToNodes([
      {
        Plan: {
          'Node Type': 'Seq Scan',
          'Relation Name': 'authors',
          'Startup Cost': 0,
          'Total Cost': 12.3,
          'Plan Rows': 10
        }
      }
    ]);

    expect(nodes[0]).toMatchObject({
      label: 'Seq Scan on authors',
      cost: '0..12.3',
      rows: '10'
    });
  });

  it('builds a compact MySQL JSON plan tree', () => {
    const nodes = mysqlJsonPlanToNodes({
      query_block: {
        table: {
          table_name: 'authors',
          access_type: 'ALL',
          rows_examined_per_scan: 3
        }
      }
    });

    expect(nodes[0]?.children?.[0]).toMatchObject({
      label: 'query_block: authors',
      detail: 'access: ALL',
      rows: '3'
    });
  });
});
