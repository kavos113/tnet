import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { EditorState, type Extension } from '@codemirror/state';
import { EditorView, runScopeHandlers } from '@codemirror/view';
import { afterEach, describe, expect, it } from 'vitest';
import { inlineCompletionExtension } from '../inlineCompletion/inlineCompletionExtension';
import { setInlineCompletionEffect } from '../inlineCompletion/inlineCompletionState';
import { insertMarkdownTab, markdownTabEditingExtension } from './markdownTabEditing';
import { tableEditingExtension } from './tableEditing/tableEditingExtension';

const markdownSupport = markdown({ base: markdownLanguage });

const createView = (
  doc: string,
  selection: number,
  extensions: Extension[] = [markdownSupport]
): EditorView => {
  const parent = document.createElement('div');
  document.body.append(parent);
  return new EditorView({
    parent,
    state: EditorState.create({
      doc,
      selection: { anchor: selection },
      extensions
    })
  });
};

const runTab = (view: EditorView, shiftKey = false): boolean =>
  runScopeHandlers(view, new KeyboardEvent('keydown', { key: 'Tab', shiftKey }), 'editor');

describe('markdownTabEditing', () => {
  let view: EditorView | undefined;

  afterEach(() => {
    const parent = view?.dom.parentElement;
    view?.destroy();
    parent?.remove();
    view = undefined;
  });

  it('inserts a tab character in normal text', () => {
    view = createView('hello world', 'hello'.length);

    expect(insertMarkdownTab(view)).toBe(true);

    expect(view.state.doc.toString()).toBe('hello\t world');
    expect(view.state.selection.main.head).toBe('hello\t'.length);
  });

  it('indents bullet, ordered, and task list items with a tab character', () => {
    const testcases = [
      { name: 'bullet', doc: '- item', cursorText: 'item', expected: '\t- item' },
      { name: 'ordered', doc: '1. item', cursorText: 'item', expected: '\t1. item' },
      { name: 'task', doc: '- [ ] item', cursorText: 'item', expected: '\t- [ ] item' }
    ];

    for (const testcase of testcases) {
      view?.destroy();
      view?.dom.parentElement?.remove();
      view = createView(testcase.doc, testcase.doc.indexOf(testcase.cursorText));

      expect(insertMarkdownTab(view), testcase.name).toBe(true);
      expect(view.state.doc.toString(), testcase.name).toBe(testcase.expected);
    }
  });

  it('dedents list items with Shift-Tab', () => {
    view = createView('\t- item', '\t- item'.indexOf('item'), [
      markdownSupport,
      markdownTabEditingExtension()
    ]);

    expect(runTab(view, true)).toBe(true);

    expect(view.state.doc.toString()).toBe('- item');
    expect(view.state.selection.main.head).toBe('- item'.indexOf('item'));
  });

  it('treats list-like text inside fenced code as normal tab input', () => {
    const doc = ['```', '- code', '```'].join('\n');
    view = createView(doc, doc.indexOf('code'));

    expect(insertMarkdownTab(view)).toBe(true);

    expect(view.state.doc.toString()).toBe(['```', '- \tcode', '```'].join('\n'));
  });

  it('keeps table Tab navigation ahead of normal tab insertion', () => {
    const doc = ['| A | B |', '| --- | --- |', '| x | y |'].join('\n');
    view = createView(doc, doc.indexOf('A'), [
      markdownSupport,
      tableEditingExtension(),
      markdownTabEditingExtension()
    ]);

    expect(runTab(view)).toBe(true);

    expect(view.state.doc.toString()).toBe(
      ['| A   | B   |', '| --- | --- |', '| x   | y   |'].join('\n')
    );
    expect(view.state.selection.main.head).toBe(view.state.doc.toString().indexOf('B'));
  });

  it('keeps inline completion acceptance ahead of normal tab insertion', () => {
    view = createView('hello', 'hello'.length, [
      inlineCompletionExtension({}),
      markdownTabEditingExtension()
    ]);
    view.dispatch({
      effects: setInlineCompletionEffect.of({
        id: 'completion',
        text: ' world',
        from: 'hello'.length
      })
    });

    expect(runTab(view)).toBe(true);

    expect(view.state.doc.toString()).toBe('hello world');
    expect(view.state.selection.main.head).toBe('hello world'.length);
  });
});
