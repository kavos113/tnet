import { EditorState } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { afterEach, describe, expect, it } from 'vitest';
import {
  formatTableCommand,
  moveToNextTableCell,
  moveToNextTableRow,
  moveToPreviousTableCell
} from './tableEditingExtension';

const createView = (doc: string, selection: number): EditorView => {
  const parent = document.createElement('div');
  document.body.append(parent);
  return new EditorView({
    parent,
    state: EditorState.create({
      doc,
      selection: { anchor: selection }
    })
  });
};

describe('tableEditingExtension commands', () => {
  let view: EditorView | undefined;

  afterEach(() => {
    const parent = view?.dom.parentElement;
    view?.destroy();
    parent?.remove();
    view = undefined;
  });

  it('moves to the next cell and formats the table', () => {
    const doc = ['| A | Long |', '| --- | --- |', '| value | x |'].join('\n');
    view = createView(doc, doc.indexOf('A'));

    expect(moveToNextTableCell(view)).toBe(true);

    expect(view.state.doc.toString()).toBe(
      ['| A     | Long |', '| ----- | ---- |', '| value | x    |'].join('\n')
    );
    expect(view.state.selection.main.head).toBe(view.state.doc.toString().indexOf('Long'));
  });

  it('adds a row when Tab is used from the last cell', () => {
    const doc = ['| A | B |', '| --- | --- |', '| x | y |'].join('\n');
    view = createView(doc, doc.indexOf('y'));

    expect(moveToNextTableCell(view)).toBe(true);

    expect(view.state.doc.toString()).toBe(
      ['| A   | B   |', '| --- | --- |', '| x   | y   |', '|     |     |'].join('\n')
    );
    expect(view.state.selection.main.head).toBe(
      view.state.doc.toString().lastIndexOf('\n|     |') + 3
    );
  });

  it('moves to the previous cell with Shift-Tab', () => {
    const doc = ['| A | B |', '| --- | --- |', '| x | y |'].join('\n');
    view = createView(doc, doc.indexOf('y'));

    expect(moveToPreviousTableCell(view)).toBe(true);

    expect(view.state.selection.main.head).toBe(view.state.doc.toString().indexOf('x'));
  });

  it('moves to the same column in the next row with Enter', () => {
    const doc = ['| A | B |', '| --- | --- |', '| x | y |'].join('\n');
    view = createView(doc, doc.indexOf('B'));

    expect(moveToNextTableRow(view)).toBe(true);

    expect(view.state.selection.main.head).toBe(view.state.doc.toString().indexOf('y'));
  });

  it('formats the current table without changing non-table content', () => {
    const doc = ['before', '', '| A | B |', '| --- | --- |', '| x | long |', '', 'after'].join(
      '\n'
    );
    view = createView(doc, doc.indexOf('long'));

    expect(formatTableCommand(view)).toBe(true);

    expect(view.state.doc.toString()).toBe(
      ['before', '', '| A   | B    |', '| --- | ---- |', '| x   | long |', '', 'after'].join('\n')
    );
  });

  it('does nothing outside tables', () => {
    view = createView('plain text', 0);

    expect(moveToNextTableCell(view)).toBe(false);
    expect(view.state.doc.toString()).toBe('plain text');
  });
});
