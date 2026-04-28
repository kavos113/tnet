import type { EditorState } from '@codemirror/state';

export type TableAlignment = 'none' | 'left' | 'center' | 'right';

export interface ParsedMarkdownTable {
  fromLine: number;
  toLine: number;
  separatorRowIndex: number;
  rows: string[][];
  alignments: TableAlignment[];
}

export interface FormattedMarkdownTable {
  text: string;
  cellStarts: number[][];
}

export interface TableContext {
  table: ParsedMarkdownTable;
  activeRowIndex: number;
  activeColumnIndex: number;
}

const hasUnescapedPipe = (line: string): boolean => {
  for (let index = 0; index < line.length; index += 1) {
    if (line[index] === '|' && line[index - 1] !== '\\') return true;
  }
  return false;
};

const splitTableRow = (line: string): string[] => {
  const cells: string[] = [];
  let current = '';
  let start = 0;
  let end = line.length;

  if (line[start] === '|') start += 1;
  if (end > start && line[end - 1] === '|' && line[end - 2] !== '\\') end -= 1;

  for (let index = start; index < end; index += 1) {
    const char = line[index];
    if (char === '|' && line[index - 1] !== '\\') {
      cells.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  cells.push(current.trim());

  return cells;
};

const parseSeparatorCell = (cell: string): TableAlignment | null => {
  const trimmed = cell.trim();
  if (!/^:?-{3,}:?$/.test(trimmed)) return null;
  const starts = trimmed.startsWith(':');
  const ends = trimmed.endsWith(':');
  if (starts && ends) return 'center';
  if (starts) return 'left';
  if (ends) return 'right';
  return 'none';
};

const separatorAlignments = (line: string): TableAlignment[] | null => {
  const cells = splitTableRow(line);
  if (cells.length === 0) return null;
  const alignments = cells.map(parseSeparatorCell);
  return alignments.every((alignment) => alignment !== null)
    ? (alignments as TableAlignment[])
    : null;
};

const isFenceLine = (line: string): boolean => /^\s*(```|~~~)/.test(line);

const isLineInFence = (state: EditorState, lineNumber: number): boolean => {
  let inFence = false;
  for (let currentLine = 1; currentLine < lineNumber; currentLine += 1) {
    if (isFenceLine(state.doc.line(currentLine).text)) inFence = !inFence;
  }
  return inFence;
};

const findCellColumn = (lineText: string, columnOffset: number): number => {
  const boundaries: number[] = [];
  for (let index = 0; index < lineText.length; index += 1) {
    if (lineText[index] === '|' && lineText[index - 1] !== '\\') boundaries.push(index);
  }

  if (boundaries.length === 0) return 0;
  if (boundaries[0] === 0) boundaries.shift();
  if (boundaries.at(-1) === lineText.length - 1) boundaries.pop();

  let column = 0;
  for (const boundary of boundaries) {
    if (columnOffset <= boundary) return column;
    column += 1;
  }
  return column;
};

const normalizedRows = (rows: string[][], alignments: TableAlignment[]): string[][] => {
  const columnCount = Math.max(alignments.length, ...rows.map((row) => row.length));
  return rows.map((row) =>
    Array.from({ length: columnCount }, (_, index) => row[index]?.trim() ?? '')
  );
};

const separatorContent = (alignment: TableAlignment, width: number): string => {
  const targetWidth = Math.max(3, width);
  if (alignment === 'left') return `:${'-'.repeat(targetWidth - 1)}`;
  if (alignment === 'right') return `${'-'.repeat(targetWidth - 1)}:`;
  if (alignment === 'center') return `:${'-'.repeat(targetWidth - 2)}:`;
  return '-'.repeat(targetWidth);
};

export const parseMarkdownTableAt = (state: EditorState, position: number): TableContext | null => {
  const activeLine = state.doc.lineAt(position);
  if (isLineInFence(state, activeLine.number)) return null;
  if (!hasUnescapedPipe(activeLine.text)) return null;

  let fromLine = activeLine.number;
  while (fromLine > 1 && hasUnescapedPipe(state.doc.line(fromLine - 1).text)) {
    fromLine -= 1;
  }

  let toLine = activeLine.number;
  while (toLine < state.doc.lines && hasUnescapedPipe(state.doc.line(toLine + 1).text)) {
    toLine += 1;
  }

  const rows = Array.from({ length: toLine - fromLine + 1 }, (_, index) =>
    splitTableRow(state.doc.line(fromLine + index).text)
  );
  const separatorRowIndex = rows.findIndex((_, index) => {
    const alignments = separatorAlignments(state.doc.line(fromLine + index).text);
    return alignments !== null;
  });
  if (separatorRowIndex <= 0) return null;

  const alignments = separatorAlignments(state.doc.line(fromLine + separatorRowIndex).text);
  if (!alignments) return null;

  return {
    table: {
      fromLine,
      toLine,
      separatorRowIndex,
      rows,
      alignments
    },
    activeRowIndex: activeLine.number - fromLine,
    activeColumnIndex: findCellColumn(activeLine.text, position - activeLine.from)
  };
};

export const formatMarkdownTable = (table: ParsedMarkdownTable): FormattedMarkdownTable => {
  const rows = normalizedRows(table.rows, table.alignments);
  const columnCount = rows[0]?.length ?? 0;
  const widths = Array.from({ length: columnCount }, (_, columnIndex) =>
    Math.max(
      3,
      ...rows
        .filter((_, rowIndex) => rowIndex !== table.separatorRowIndex)
        .map((row) => row[columnIndex]?.length ?? 0)
    )
  );

  const lines = rows.map((row, rowIndex) => {
    const starts: number[] = [];
    let cellStart = 2;
    const cells = row.map((cell, columnIndex) => {
      const width = widths[columnIndex] ?? 3;
      starts[columnIndex] = cellStart;
      cellStart += width + 3;
      if (rowIndex === table.separatorRowIndex) {
        return separatorContent(table.alignments[columnIndex] ?? 'none', width).padEnd(width);
      }
      return cell.padEnd(width);
    });
    return { line: `| ${cells.join(' | ')} |`, starts };
  });

  return {
    text: lines.map((line) => line.line).join('\n'),
    cellStarts: lines.map((line) => line.starts)
  };
};

export const tableRange = (
  state: EditorState,
  table: ParsedMarkdownTable
): { from: number; to: number } => ({
  from: state.doc.line(table.fromLine).from,
  to: state.doc.line(table.toLine).to
});
