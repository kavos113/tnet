import { EditorState } from '@codemirror/state';
import { describe, expect, it } from 'vitest';
import { formatMarkdownTable, parseMarkdownTableAt } from './tableModel';

const stateOf = (doc: string): EditorState => EditorState.create({ doc });

describe('tableModel', () => {
  it('formats a basic markdown table with padded columns', () => {
    const state = stateOf(['| A | Long |', '| --- | --- |', '| value | x |'].join('\n'));
    const context = parseMarkdownTableAt(state, 2);
    expect(context).not.toBeNull();

    const formatted = formatMarkdownTable(context!.table);

    expect(formatted.text).toBe(
      ['| A     | Long |', '| ----- | ---- |', '| value | x    |'].join('\n')
    );
  });

  it('preserves column alignment markers', () => {
    const state = stateOf(['| A | B | C |', '| :--- | :---: | ---: |', '| x | y | z |'].join('\n'));
    const context = parseMarkdownTableAt(state, 4);

    expect(formatMarkdownTable(context!.table).text).toContain('| :-- | :-: | --: |');
  });

  it('does not split escaped pipes as cell separators', () => {
    const state = stateOf(['| A | B |', '| --- | --- |', '| a \\| b | c |'].join('\n'));
    const context = parseMarkdownTableAt(state, state.doc.toString().indexOf('\\|'));

    expect(formatMarkdownTable(context!.table).text).toContain('| a \\| b | c   |');
  });

  it('pads missing cells and keeps extra cells', () => {
    const state = stateOf(['| A | B |', '| --- | --- |', '| one |', '| x | y | z |'].join('\n'));
    const context = parseMarkdownTableAt(state, state.doc.toString().indexOf('one'));

    expect(formatMarkdownTable(context!.table).text).toBe(
      [
        '| A   | B   |     |',
        '| --- | --- | --- |',
        '| one |     |     |',
        '| x   | y   | z   |'
      ].join('\n')
    );
  });

  it('ignores pipe-shaped content inside fenced code blocks', () => {
    const state = stateOf(['```', '| A | B |', '| --- | --- |', '```'].join('\n'));

    expect(parseMarkdownTableAt(state, state.doc.toString().indexOf('A'))).toBeNull();
  });
});
