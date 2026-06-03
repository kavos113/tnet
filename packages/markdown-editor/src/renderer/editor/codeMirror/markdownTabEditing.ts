import { syntaxTree } from '@codemirror/language';
import {
  EditorSelection,
  Prec,
  type ChangeSpec,
  type EditorState,
  type Extension
} from '@codemirror/state';
import { keymap, type Command } from '@codemirror/view';

const listMarkerPattern = /^(\s*)(?:[-+*]\s+(?:\[[ xX]\]\s+)?|\d+[.)]\s+)/;

const isInFencedCode = (state: EditorState, position: number): boolean => {
  let node: ReturnType<typeof syntaxTree>['topNode'] | null = syntaxTree(state).resolveInner(
    position,
    -1
  );
  while (node) {
    if (node.name === 'FencedCode') return true;
    node = node.parent;
  }
  return false;
};

const listLineAt = (state: EditorState, position: number) => {
  const line = state.doc.lineAt(position);
  const marker = listMarkerPattern.exec(line.text);
  if (!marker) return null;
  if (isInFencedCode(state, Math.min(position, line.to))) return null;
  return { line, indent: marker[1] ?? '' };
};

export const insertMarkdownTab: Command = (view) => {
  const changes: ChangeSpec[] = [];
  const touchedListLines = new Set<number>();
  const selections = view.state.selection.ranges.map((range) => {
    if (range.empty) {
      const listLine = listLineAt(view.state, range.head);
      if (listLine && !touchedListLines.has(listLine.line.number)) {
        touchedListLines.add(listLine.line.number);
        changes.push({ from: listLine.line.from, insert: '\t' });
        return EditorSelection.cursor(range.head + 1);
      }
      changes.push({ from: range.from, insert: '\t' });
      return EditorSelection.cursor(range.head + 1);
    }

    changes.push({ from: range.from, to: range.to, insert: '\t' });
    return EditorSelection.cursor(range.from + 1);
  });

  view.dispatch({
    changes,
    selection: EditorSelection.create(selections, view.state.selection.mainIndex),
    scrollIntoView: true
  });
  return true;
};

export const dedentMarkdownListItem: Command = (view) => {
  const changes: ChangeSpec[] = [];
  const selections = view.state.selection.ranges.map((range) => {
    const listLine = listLineAt(view.state, range.head);
    if (!listLine || listLine.indent.length === 0) return range;

    const removeLength = listLine.indent.startsWith('\t') ? 1 : Math.min(4, listLine.indent.length);
    changes.push({ from: listLine.line.from, to: listLine.line.from + removeLength, insert: '' });
    return EditorSelection.cursor(Math.max(listLine.line.from, range.head - removeLength));
  });

  if (changes.length === 0) return false;

  view.dispatch({
    changes,
    selection: EditorSelection.create(selections, view.state.selection.mainIndex),
    scrollIntoView: true
  });
  return true;
};

export const markdownTabEditingExtension = (): Extension =>
  Prec.high(
    keymap.of([
      {
        key: 'Tab',
        run: insertMarkdownTab
      },
      {
        key: 'Shift-Tab',
        run: dedentMarkdownListItem
      }
    ])
  );
