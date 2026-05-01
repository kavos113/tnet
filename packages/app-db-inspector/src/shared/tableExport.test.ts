import { describe, expect, it } from 'vitest';
import type { DatabaseColumn } from './dbInspectorTypes';
import { rowToTsv, rowsToCsv } from './tableExport';

const columns: DatabaseColumn[] = [
  { name: 'id', type: 'INTEGER', nullable: false },
  { name: 'title', type: 'TEXT', nullable: false }
];

describe('tableExport', () => {
  it('exports rows to csv with escaped cells', () => {
    expect(
      rowsToCsv(columns, [
        { id: 1, title: 'simple' },
        { id: 2, title: 'with, comma and "quote"' }
      ])
    ).toBe('id,title\n1,simple\n2,"with, comma and ""quote"""');
  });

  it('exports one row to tsv', () => {
    expect(rowToTsv(columns, { id: 1, title: null })).toBe('1\tNULL');
  });
});
