import { Prec, type Extension } from '@codemirror/state';
import { keymap, type EditorView } from '@codemirror/view';
import {
  formatMarkdownTable,
  parseMarkdownTableAt,
  tableRange,
  type ParsedMarkdownTable
} from './tableModel';

type TableMove = 'next' | 'previous' | 'next-row' | 'format';

const cloneRows = (rows: string[][]): string[][] => rows.map((row) => [...row]);

const columnCount = (table: ParsedMarkdownTable): number =>
  Math.max(table.alignments.length, ...table.rows.map((row) => row.length));

const editableRows = (table: ParsedMarkdownTable): number[] =>
  table.rows.map((_, index) => index).filter((index) => index !== table.separatorRowIndex);

const emptyBodyRow = (count: number): string[] => Array.from({ length: count }, () => '');

const targetForMove = (
  table: ParsedMarkdownTable,
  rowIndex: number,
  columnIndex: number,
  move: TableMove
): { rowIndex: number; columnIndex: number; rows: string[][] } => {
  const rows = cloneRows(table.rows);
  const columns = columnCount(table);
  const editable = editableRows(table);
  const currentEditableIndex = editable.indexOf(rowIndex);

  if (move === 'format' || currentEditableIndex === -1) return { rowIndex, columnIndex, rows };

  if (move === 'previous') {
    if (columnIndex > 0) return { rowIndex, columnIndex: columnIndex - 1, rows };
    const previousRow = editable[Math.max(0, currentEditableIndex - 1)];
    return { rowIndex: previousRow, columnIndex: columns - 1, rows };
  }

  const isLastColumn = columnIndex >= columns - 1;
  const nextEditableRow = editable[currentEditableIndex + 1];
  if (move === 'next' && !isLastColumn) {
    return { rowIndex, columnIndex: columnIndex + 1, rows };
  }

  if (nextEditableRow !== undefined) {
    return { rowIndex: nextEditableRow, columnIndex: move === 'next' ? 0 : columnIndex, rows };
  }

  rows.push(emptyBodyRow(columns));
  return {
    rowIndex: rows.length - 1,
    columnIndex: move === 'next' ? 0 : columnIndex,
    rows
  };
};

const applyTableEdit = (view: EditorView, move: TableMove): boolean => {
  const context = parseMarkdownTableAt(view.state, view.state.selection.main.head);
  if (!context) return false;

  const target = targetForMove(
    context.table,
    context.activeRowIndex,
    Math.min(context.activeColumnIndex, columnCount(context.table) - 1),
    move
  );
  const nextTable: ParsedMarkdownTable = {
    ...context.table,
    rows: target.rows,
    toLine: context.table.fromLine + target.rows.length - 1
  };
  const formatted = formatMarkdownTable(nextTable);
  const range = tableRange(view.state, context.table);
  const from = range.from;
  const selection =
    from +
    formatted.text
      .split('\n')
      .slice(0, target.rowIndex)
      .reduce((offset, line) => offset + line.length + 1, 0) +
    (formatted.cellStarts[target.rowIndex]?.[target.columnIndex] ?? 0);

  view.dispatch({
    changes: { from: range.from, to: range.to, insert: formatted.text },
    selection: { anchor: selection },
    scrollIntoView: true
  });
  return true;
};

export const formatTableCommand = (view: EditorView): boolean => applyTableEdit(view, 'format');

export const moveToNextTableCell = (view: EditorView): boolean => applyTableEdit(view, 'next');

export const moveToPreviousTableCell = (view: EditorView): boolean =>
  applyTableEdit(view, 'previous');

export const moveToNextTableRow = (view: EditorView): boolean => applyTableEdit(view, 'next-row');

export const tableEditingExtension = (): Extension =>
  Prec.high(
    keymap.of([
      {
        key: 'Tab',
        run: moveToNextTableCell
      },
      {
        key: 'Shift-Tab',
        run: moveToPreviousTableCell
      },
      {
        key: 'Enter',
        run: moveToNextTableRow
      },
      {
        key: 'Mod-Shift-f',
        run: formatTableCommand
      }
    ])
  );
