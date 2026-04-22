import { useCallback, useRef, type CSSProperties } from 'react';
import type {
  InlineCompletionContext,
  InlineCompletionResult
} from '@shared/llm/inlineCompletionTypes';
import { useAppDispatch, useAppSelector } from '@renderer/app/hooks';
import { PreviewPane, type PreviewPaneHandle } from '@renderer/features/preview/PreviewPane';
import { useShortcut } from '@renderer/features/shortcuts/useShortcut';
import { useActiveWorkspaceApi } from '@renderer/features/workspace/useActiveWorkspaceApi';
import { setViewMode, updateActiveContent } from './editorSlice';
import { EditorPane, type EditorPaneHandle } from './EditorPane';
import { TabBar } from './TabBar';
import { useSaveActiveFile } from './useSaveActiveFile';
import { useScrollSync } from './useScrollSync';
import { useSplitPaneResize } from './useSplitPaneResize';

export const EditorWorkspace = (): React.JSX.Element => {
  const dispatch = useAppDispatch();
  const editorPaneRef = useRef<EditorPaneHandle | null>(null);
  const previewPaneRef = useRef<PreviewPaneHandle | null>(null);
  const workspaceApi = useActiveWorkspaceApi();
  const { openedFiles, activeIndex, viewMode } = useAppSelector((state) => state.editor);
  const settings = useAppSelector((state) => state.workspace.settings);
  const activeFile = activeIndex >= 0 ? openedFiles[activeIndex] : null;
  const activeFilePath = activeFile?.path ?? null;
  const { canSave, saveActiveFile } = useSaveActiveFile();
  const { editorWidthPercent, previewWidthPercent, startResize } = useSplitPaneResize();
  const requestInlineCompletion = useCallback(
    (context: InlineCompletionContext): Promise<InlineCompletionResult | null> => {
      if (!activeFilePath) return Promise.resolve(null);
      return workspaceApi.getInlineCompletion(activeFilePath, context);
    },
    [activeFilePath, workspaceApi.getInlineCompletion]
  );

  useShortcut({
    key: 's',
    ctrlOrMeta: true,
    enabled: canSave,
    onTrigger: () => {
      saveActiveFile().catch((error: unknown) => {
        console.error('Failed to save file', error);
      });
    }
  });

  useScrollSync({
    editorPaneRef,
    previewPaneRef,
    enabled: viewMode === 'split' && Boolean(activeFile)
  });

  return (
    <main
      className="editor-workspace"
      style={
        {
          '--editor-font-family': settings.editorFontFamily,
          '--editor-font-size': `${settings.editorFontSize}px`,
          '--preview-font-family': settings.previewFontFamily,
          '--preview-font-size': `${settings.previewFontSize}px`
        } as CSSProperties
      }
    >
      <TabBar />
      {activeFile ? (
        <>
          <div className="editor-title">
            <span>{activeFile.path}</span>
            <div className="editor-actions">
              <button
                type="button"
                className={`mode-button ${viewMode === 'editor' ? 'active' : ''}`}
                onClick={() => dispatch(setViewMode('editor'))}
              >
                Editor
              </button>
              <button
                type="button"
                className={`mode-button ${viewMode === 'split' ? 'active' : ''}`}
                onClick={() => dispatch(setViewMode('split'))}
              >
                Split
              </button>
              <button
                type="button"
                className={`mode-button ${viewMode === 'preview' ? 'active' : ''}`}
                onClick={() => dispatch(setViewMode('preview'))}
              >
                Preview
              </button>
              <button
                type="button"
                className="save-button"
                disabled={!canSave}
                onClick={() => {
                  saveActiveFile().catch((error: unknown) => {
                    console.error('Failed to save file', error);
                  });
                }}
              >
                Save
              </button>
            </div>
          </div>
          <div className="editor-content-split">
            {viewMode !== 'preview' ? (
              <div
                className="editor-pane"
                style={{ width: viewMode === 'split' ? `${editorWidthPercent}%` : '100%' }}
              >
                <EditorPane
                  ref={editorPaneRef}
                  content={activeFile.content}
                  onChange={(content) => dispatch(updateActiveContent(content))}
                  loadKeywordIndex={workspaceApi.loadKeywordIndex}
                  requestInlineCompletion={requestInlineCompletion}
                />
              </div>
            ) : null}
            {viewMode === 'split' ? (
              <div
                className="resizer"
                role="separator"
                aria-orientation="vertical"
                aria-label="Resize editor and preview"
                onMouseDown={startResize}
              />
            ) : null}
            {viewMode !== 'editor' ? (
              <div
                className="preview-pane"
                style={{ width: viewMode === 'split' ? `${previewWidthPercent}%` : '100%' }}
              >
                <PreviewPane
                  ref={previewPaneRef}
                  markdown={activeFile.content}
                  onOpenInternalLink={workspaceApi.openFile}
                  loadKeywordContent={workspaceApi.getKeywordContent}
                />
              </div>
            ) : null}
          </div>
        </>
      ) : (
        <div className="empty-editor">No file selected</div>
      )}
    </main>
  );
};
