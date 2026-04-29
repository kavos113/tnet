import { useCallback } from 'react';
import type {
  InlineCompletionContext,
  InlineCompletionResult
} from '@tnet/app-markdown/shared/llm/inlineCompletionTypes';
import { textByteLength } from '@tnet/shared/file/largeFile';
import { toWorkspaceRelativePath } from '@tnet/shared/path/pathUtils';
import { openFile, type EditorGroupId } from '@tnet/app-markdown/renderer/editor/editorSlice';
import { markdownTnetApi } from '@tnet/app-markdown/renderer/markdownTnetApi';
import { useAppDispatch, useAppSelector } from '@tnet/app-markdown/renderer/storeHooks';
import { tnetApi } from '@tnet/renderer-core/tnetApi';

export interface ActiveWorkspaceApi {
  rootPath: string;
  hasWorkspace: boolean;
  readFile: (filePath: string) => Promise<string>;
  writeFile: (filePath: string, content: string) => Promise<void>;
  savePastedImage: (request: {
    preferredName?: string;
    mimeType: string;
    contentBase64: string;
  }) => Promise<string | null>;
  readImageDataUrl: (filename: string) => Promise<string | null>;
  openFile: (filePath: string, options?: { targetGroupId?: EditorGroupId }) => Promise<void>;
  loadKeywordIndex: () => Promise<Record<string, string>>;
  getKeywordContent: (filePath: string, name: string) => Promise<string | null>;
  getInlineCompletion: (
    filePath: string,
    context: InlineCompletionContext
  ) => Promise<InlineCompletionResult | null>;
}

const isMarkdownFilePath = (filePath: string): boolean => filePath.toLowerCase().endsWith('.md');

export const useActiveMarkdownWorkspaceApi = (): ActiveWorkspaceApi => {
  const dispatch = useAppDispatch();
  const rootPath = useAppSelector((state) => state.workspace.rootPath);
  const llmSettings = useAppSelector((state) => state.workspace.settings.llm);
  const toWorkspacePathRequest = useCallback(
    (filePath: string): { rootDir: string; path: string } => ({
      rootDir: rootPath,
      path: toWorkspaceRelativePath(rootPath, filePath)
    }),
    [rootPath]
  );

  const writeFile = useCallback(
    async (filePath: string, content: string): Promise<void> => {
      if (!rootPath) return;
      await markdownTnetApi.markdown.file.write({ ...toWorkspacePathRequest(filePath), content });
    },
    [rootPath, toWorkspacePathRequest]
  );

  const readFile = useCallback(
    async (filePath: string): Promise<string> => {
      return tnetApi.file.read(toWorkspacePathRequest(filePath));
    },
    [toWorkspacePathRequest]
  );

  const savePastedImage = useCallback(
    async (request: {
      preferredName?: string;
      mimeType: string;
      contentBase64: string;
    }): Promise<string | null> => {
      if (!rootPath) return null;
      const result = await markdownTnetApi.markdown.file.saveImage({
        rootDir: rootPath,
        preferredName: request.preferredName,
        mimeType: request.mimeType,
        contentBase64: request.contentBase64
      });
      return result.filename;
    },
    [rootPath]
  );

  const readImageDataUrl = useCallback(
    async (filename: string): Promise<string | null> => {
      if (!rootPath) return null;
      const result = await markdownTnetApi.markdown.file.readImage({ rootDir: rootPath, filename });
      return result.dataUrl;
    },
    [rootPath]
  );

  const openWorkspaceFile = useCallback(
    async (filePath: string, options: { targetGroupId?: EditorGroupId } = {}): Promise<void> => {
      if (!isMarkdownFilePath(filePath)) {
        await tnetApi.file.openWithDefaultApp(toWorkspacePathRequest(filePath));
        return;
      }

      const startedAt = performance.now();
      const content = await tnetApi.file.read(toWorkspacePathRequest(filePath));
      if (import.meta.env.DEV) {
        console.debug('File read', Math.round(performance.now() - startedAt), 'ms');
      }
      dispatch(
        openFile({
          path: filePath,
          content,
          sizeBytes: textByteLength(content),
          targetGroupId: options.targetGroupId
        })
      );
    },
    [dispatch, toWorkspacePathRequest]
  );

  const loadKeywordIndex = useCallback(async (): Promise<Record<string, string>> => {
    if (!rootPath) return {};
    return markdownTnetApi.markdown.keyword.loadIndex(rootPath);
  }, [rootPath]);

  const getKeywordContent = useCallback(
    async (filePath: string, name: string): Promise<string | null> => {
      return markdownTnetApi.markdown.keyword.getContent({
        ...toWorkspacePathRequest(filePath),
        name
      });
    },
    [toWorkspacePathRequest]
  );

  const getInlineCompletion = useCallback(
    async (
      filePath: string,
      context: InlineCompletionContext
    ): Promise<InlineCompletionResult | null> => {
      if (!rootPath) return null;
      if (!llmSettings.llmInlineCompletionEnabled) return null;
      if (context.trigger === 'automatic' && !llmSettings.llmAutomaticTrigger) return null;
      return markdownTnetApi.markdown.llm.getInlineCompletion({
        ...context,
        workspaceRoot: rootPath,
        filePath: toWorkspaceRelativePath(rootPath, filePath),
        language: 'markdown'
      });
    },
    [rootPath, llmSettings.llmAutomaticTrigger, llmSettings.llmInlineCompletionEnabled]
  );

  return {
    rootPath,
    hasWorkspace: Boolean(rootPath),
    readFile,
    writeFile,
    savePastedImage,
    readImageDataUrl,
    openFile: openWorkspaceFile,
    loadKeywordIndex,
    getKeywordContent,
    getInlineCompletion
  };
};
