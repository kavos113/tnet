import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import { shallowEqual } from 'react-redux';
import type {
  InlineCompletionContext,
  InlineCompletionResult
} from '@tnet/app-markdown/shared/llm/inlineCompletionTypes';
import { largeMarkdownFileThresholdBytes } from '@tnet/shared/file/largeFile';
import { useAppDispatch, useAppSelector } from '@tnet/app-markdown/renderer/storeHooks';
import {
  PreviewPane,
  type PreviewPaneHandle
} from '@tnet/app-markdown/renderer/preview/PreviewPane';
import { toggleMarkdownTask } from '@tnet/markdown-editor/renderer';
import { useShortcut } from '@tnet/renderer-core/shortcuts/useShortcut';
import { useActiveMarkdownWorkspaceApi } from '@tnet/app-markdown/renderer/workspace/useActiveMarkdownWorkspaceApi';
import {
  clearPendingReveal,
  closeFile,
  closeSecondaryGroup,
  setActiveGroup,
  setGroupWidthPercent,
  setViewMode,
  splitActiveTabRight,
  togglePreviewOutline,
  updateActiveContent,
  type EditorGroupId
} from './editorSlice';
import { EditorPane, type EditorPaneHandle } from './EditorPane';
import { TabBar } from './TabBar';
import { useAutoSaveActiveFile } from './useAutoSaveActiveFile';
import { useSaveActiveFile } from './useSaveActiveFile';
import { useScrollSync } from './useScrollSync';
import { useSplitPaneResize } from './useSplitPaneResize';
import styles from './EditorWorkspace.module.css';

interface EditorGroupViewProps {
  groupId: EditorGroupId;
}

const EditorGroupView = ({ groupId }: EditorGroupViewProps): React.JSX.Element => {
  const dispatch = useAppDispatch();
  const editorPaneRef = useRef<EditorPaneHandle | null>(null);
  const previewPaneRef = useRef<PreviewPaneHandle | null>(null);
  const workspaceApi = useActiveMarkdownWorkspaceApi();
  const llmSettings = useAppSelector((state) => state.workspace.settings.llm);
  const { group, activeFile, activeFilePath, isActiveGroup, pendingReveal } = useAppSelector(
    (state) => {
      const nextGroup = state.editor.groups[groupId];
      const nextActivePath =
        nextGroup.activeIndex >= 0 && nextGroup.activeIndex < nextGroup.tabs.length
          ? nextGroup.tabs[nextGroup.activeIndex]
          : null;
      return {
        group: nextGroup,
        activeFile: nextActivePath ? state.editor.filesByPath[nextActivePath] : null,
        activeFilePath: nextActivePath,
        isActiveGroup: state.editor.activeGroupId === groupId,
        pendingReveal: state.editor.pendingReveal
      };
    },
    shallowEqual
  );
  const isLargeActiveFile = (activeFile?.sizeBytes ?? 0) >= largeMarkdownFileThresholdBytes;
  const { canSave, saveActiveFile } = useSaveActiveFile(groupId);
  const { editorWidthPercent, previewWidthPercent, startResize } = useSplitPaneResize();
  const [previewRenderVersion, setPreviewRenderVersion] = useState(0);
  const [largePreviewAllowedPaths, setLargePreviewAllowedPaths] = useState<Set<string>>(
    () => new Set()
  );
  const isLargePreviewAllowed =
    activeFilePath !== null && largePreviewAllowedPaths.has(activeFilePath);
  const effectiveViewMode = isLargeActiveFile && !isLargePreviewAllowed ? 'editor' : group.viewMode;
  const requestInlineCompletion = useCallback(
    (context: InlineCompletionContext): Promise<InlineCompletionResult | null> => {
      if (!activeFilePath) return Promise.resolve(null);
      return workspaceApi.getInlineCompletion(activeFilePath, context);
    },
    [activeFilePath, workspaceApi.getInlineCompletion]
  );
  const handlePreviewRendered = useCallback(() => {
    setPreviewRenderVersion((version) => version + 1);
  }, []);

  useAutoSaveActiveFile({
    groupId,
    canSave,
    saveActiveFile
  });

  useScrollSync({
    editorPaneRef,
    previewPaneRef,
    enabled: effectiveViewMode === 'split' && Boolean(activeFile),
    syncKey: [
      groupId,
      activeFilePath,
      group.isPreviewOutlineVisible,
      editorWidthPercent,
      previewWidthPercent,
      previewRenderVersion
    ].join('|')
  });

  useEffect(() => {
    if (
      !pendingReveal ||
      pendingReveal.groupId !== groupId ||
      pendingReveal.path !== activeFilePath
    ) {
      return;
    }
    if (effectiveViewMode === 'preview') {
      dispatch(setViewMode({ groupId, viewMode: 'split' }));
      return;
    }

    const frame = requestAnimationFrame(() => {
      if (editorPaneRef.current?.revealLine(pendingReveal.lineNumber)) {
        dispatch(clearPendingReveal(pendingReveal.requestId));
      }
    });

    return () => cancelAnimationFrame(frame);
  }, [activeFilePath, dispatch, effectiveViewMode, groupId, pendingReveal]);

  const setEditorViewMode = useCallback(
    (nextViewMode: 'editor' | 'split' | 'preview'): void => {
      if (activeFilePath && isLargeActiveFile && nextViewMode !== 'editor') {
        setLargePreviewAllowedPaths((current) => new Set(current).add(activeFilePath));
      }
      dispatch(setViewMode({ groupId, viewMode: nextViewMode }));
    },
    [activeFilePath, dispatch, groupId, isLargeActiveFile]
  );
  const handleToggleTask = useCallback(
    (sourceLine: number, checked: boolean): void => {
      if (!activeFile) return;
      const nextContent = toggleMarkdownTask(activeFile.content, sourceLine, checked);
      if (nextContent === activeFile.content) return;
      dispatch(updateActiveContent({ groupId, content: nextContent }));
    },
    [activeFile, dispatch, groupId]
  );

  return (
    <section
      className={`${styles.group} ${isActiveGroup ? styles.activeGroup : ''}`}
      onMouseDown={() => dispatch(setActiveGroup(groupId))}
    >
      <TabBar groupId={groupId} />
      {activeFile ? (
        <>
          <div className={styles.title}>
            <span>{activeFile.path}</span>
            <div className={styles.actions}>
              <button
                type="button"
                className={`${styles.modeButton} ${
                  effectiveViewMode === 'editor' ? styles.modeButtonActive : ''
                }`}
                aria-pressed={effectiveViewMode === 'editor'}
                onClick={() => setEditorViewMode('editor')}
              >
                Editor
              </button>
              <button
                type="button"
                className={`${styles.modeButton} ${
                  effectiveViewMode === 'split' ? styles.modeButtonActive : ''
                }`}
                aria-pressed={effectiveViewMode === 'split'}
                onClick={() => setEditorViewMode('split')}
              >
                Split
              </button>
              <button
                type="button"
                className={`${styles.modeButton} ${
                  effectiveViewMode === 'preview' ? styles.modeButtonActive : ''
                }`}
                aria-pressed={effectiveViewMode === 'preview'}
                onClick={() => setEditorViewMode('preview')}
              >
                Preview
              </button>
              {effectiveViewMode !== 'editor' ? (
                <button
                  type="button"
                  className={`${styles.modeButton} ${
                    group.isPreviewOutlineVisible ? styles.modeButtonActive : ''
                  }`}
                  aria-pressed={group.isPreviewOutlineVisible}
                  onClick={() => dispatch(togglePreviewOutline(groupId))}
                >
                  Outline
                </button>
              ) : null}
              {groupId === 'secondary' ? (
                <button
                  type="button"
                  className={styles.modeButton}
                  onClick={() => dispatch(closeSecondaryGroup())}
                >
                  Close Group
                </button>
              ) : (
                <button
                  type="button"
                  className={styles.modeButton}
                  onClick={() => dispatch(splitActiveTabRight())}
                >
                  Split Right
                </button>
              )}
              <button
                type="button"
                className={styles.saveButton}
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
          <div className={styles.contentSplit}>
            {effectiveViewMode !== 'preview' ? (
              <div
                className={styles.editorPane}
                style={{ width: effectiveViewMode === 'split' ? `${editorWidthPercent}%` : '100%' }}
              >
                <EditorPane
                  ref={editorPaneRef}
                  content={activeFile.content}
                  onChange={(content) => dispatch(updateActiveContent({ groupId, content }))}
                  loadKeywordIndex={workspaceApi.loadKeywordIndex}
                  requestInlineCompletion={requestInlineCompletion}
                  savePastedImage={workspaceApi.savePastedImage}
                  inlineCompletionDebounceMs={llmSettings.llmDebounceMs}
                  inlineCompletionMaxPrefixChars={llmSettings.llmMaxPrefixChars}
                  inlineCompletionMaxSuffixChars={llmSettings.llmMaxSuffixChars}
                  isLargeDocument={isLargeActiveFile}
                />
              </div>
            ) : null}
            {effectiveViewMode === 'split' ? (
              <div
                className={styles.resizer}
                role="separator"
                aria-orientation="vertical"
                aria-label="Resize editor and preview"
                onMouseDown={startResize}
              />
            ) : null}
            {effectiveViewMode !== 'editor' ? (
              <div
                className={styles.previewPane}
                style={{
                  width: effectiveViewMode === 'split' ? `${previewWidthPercent}%` : '100%'
                }}
              >
                <PreviewPane
                  ref={previewPaneRef}
                  markdown={activeFile.content}
                  showOutline={group.isPreviewOutlineVisible}
                  onOpenInternalLink={(filePath) =>
                    workspaceApi.openFile(filePath, { targetGroupId: groupId })
                  }
                  onToggleTask={handleToggleTask}
                  loadKeywordContent={workspaceApi.getKeywordContent}
                  loadImageDataUrl={workspaceApi.readImageDataUrl}
                  onRendered={handlePreviewRendered}
                  renderDebounceMs={isLargeActiveFile ? 500 : 80}
                />
              </div>
            ) : null}
          </div>
        </>
      ) : (
        <div className={styles.empty}>No file selected</div>
      )}
    </section>
  );
};

export const EditorWorkspace = (): React.JSX.Element => {
  const dispatch = useAppDispatch();
  const markdownSettings = useAppSelector((state) => state.workspace.settings.markdown);
  const { activeIndex, groupWidthPercent, isSecondaryGroupVisible } = useAppSelector(
    (state) => state.editor
  );
  const { canSave, saveActiveFile } = useSaveActiveFile();

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

  useShortcut({
    key: 'w',
    ctrlOrMeta: true,
    target: 'document',
    allowInEditable: true,
    enabled: activeIndex >= 0,
    onTrigger: () => {
      dispatch(closeFile(activeIndex));
    }
  });

  useShortcut({
    key: '\\',
    ctrlOrMeta: true,
    target: 'document',
    allowInEditable: true,
    enabled: activeIndex >= 0,
    onTrigger: () => {
      dispatch(splitActiveTabRight());
    }
  });

  const startGroupResize = useCallback(
    (event: React.MouseEvent<HTMLElement>): void => {
      event.preventDefault();
      const container = event.currentTarget.parentElement;
      if (!container) return;

      const containerRect = container.getBoundingClientRect();
      const handleMouseMove = (moveEvent: MouseEvent): void => {
        const widthPercent =
          containerRect.width <= 0
            ? 50
            : ((moveEvent.clientX - containerRect.left) / containerRect.width) * 100;
        dispatch(setGroupWidthPercent(widthPercent));
      };
      const handleMouseUp = (): void => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    },
    [dispatch]
  );

  return (
    <main
      className={styles.workspace}
      style={
        {
          '--editor-font-family': markdownSettings.editorFontFamily,
          '--editor-font-size': `${markdownSettings.editorFontSize}px`,
          '--preview-font-family': markdownSettings.previewFontFamily,
          '--preview-font-size': `${markdownSettings.previewFontSize}px`
        } as CSSProperties
      }
    >
      <div className={styles.groups}>
        <div
          className={styles.groupWrapper}
          style={{ width: isSecondaryGroupVisible ? `${groupWidthPercent}%` : '100%' }}
        >
          <EditorGroupView groupId="primary" />
        </div>
        {isSecondaryGroupVisible ? (
          <>
            <div
              className={styles.groupResizer}
              role="separator"
              aria-orientation="vertical"
              aria-label="Resize editor groups"
              onMouseDown={startGroupResize}
            />
            <div className={styles.groupWrapper} style={{ width: `${100 - groupWidthPercent}%` }}>
              <EditorGroupView groupId="secondary" />
            </div>
          </>
        ) : null}
      </div>
    </main>
  );
};
