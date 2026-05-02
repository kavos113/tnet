import { forwardRef, useMemo } from 'react';
import { MarkdownEditorPane, type MarkdownEditorPaneHandle } from '@tnet/markdown-editor/renderer';
import type { KeywordIndexLoader } from './codeMirror/completions';
import {
  createPdfLinkCompletionIndexLoader,
  keywordCompletion,
  pdfLinkCompletion,
  tagCompletion
} from './codeMirror/completions';
import { keywordDecorationPlugin } from './codeMirror/keywordDecorations';
import type { SavePastedImageRequester } from '@tnet/markdown-editor/renderer';
import type { InlineCompletionRequester } from '@tnet/markdown-editor/renderer';

interface EditorPaneProps {
  content: string;
  onChange: (content: string) => void;
  loadKeywordIndex: KeywordIndexLoader;
  requestInlineCompletion?: InlineCompletionRequester;
  savePastedImage?: SavePastedImageRequester;
  inlineCompletionDebounceMs?: number;
  inlineCompletionMaxPrefixChars?: number;
  inlineCompletionMaxSuffixChars?: number;
  isLargeDocument?: boolean;
}

export type EditorPaneHandle = MarkdownEditorPaneHandle;

export const EditorPane = forwardRef<EditorPaneHandle, EditorPaneProps>(
  (
    {
      content,
      onChange,
      loadKeywordIndex,
      requestInlineCompletion,
      savePastedImage,
      inlineCompletionDebounceMs,
      inlineCompletionMaxPrefixChars,
      inlineCompletionMaxSuffixChars,
      isLargeDocument
    },
    ref
  ): React.JSX.Element => {
    const completionSources = useMemo(
      () => [
        keywordCompletion(loadKeywordIndex),
        pdfLinkCompletion(createPdfLinkCompletionIndexLoader()),
        tagCompletion
      ],
      [loadKeywordIndex]
    );
    const editorExtensions = useMemo(() => [keywordDecorationPlugin()], []);

    return (
      <MarkdownEditorPane
        ref={ref}
        content={content}
        onChange={onChange}
        completionSources={completionSources}
        editorExtensions={editorExtensions}
        requestInlineCompletion={requestInlineCompletion}
        savePastedImage={savePastedImage}
        inlineCompletionDebounceMs={inlineCompletionDebounceMs}
        inlineCompletionMaxPrefixChars={inlineCompletionMaxPrefixChars}
        inlineCompletionMaxSuffixChars={inlineCompletionMaxSuffixChars}
        isLargeDocument={isLargeDocument}
      />
    );
  }
);

EditorPane.displayName = 'EditorPane';
