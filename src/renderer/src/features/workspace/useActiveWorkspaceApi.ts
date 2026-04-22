import { useCallback } from 'react';
import type {
  InlineCompletionContext,
  InlineCompletionResult
} from '@shared/llm/inlineCompletionTypes';
import { toWorkspaceRelativePath } from '@shared/path/pathUtils';
import { openFile } from '@renderer/features/editor/editorSlice';
import { useAppDispatch, useAppSelector } from '@renderer/app/hooks';
import { tnetApi } from '@renderer/lib/tnetApi';

export interface ActiveWorkspaceApi {
  rootPath: string;
  hasWorkspace: boolean;
  readFile: (filePath: string) => Promise<string>;
  writeFile: (filePath: string, content: string) => Promise<void>;
  openFile: (filePath: string) => Promise<void>;
  loadKeywordIndex: () => Promise<Record<string, string>>;
  getKeywordContent: (filePath: string, name: string) => Promise<string | null>;
  getInlineCompletion: (
    filePath: string,
    context: InlineCompletionContext
  ) => Promise<InlineCompletionResult | null>;
}

export const useActiveWorkspaceApi = (): ActiveWorkspaceApi => {
  const dispatch = useAppDispatch();
  const rootPath = useAppSelector((state) => state.workspace.rootPath);
  const settings = useAppSelector((state) => state.workspace.settings);
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
      await tnetApi.file.write({ ...toWorkspacePathRequest(filePath), content });
    },
    [rootPath, toWorkspacePathRequest]
  );

  const readFile = useCallback(
    async (filePath: string): Promise<string> => {
      return tnetApi.file.read(toWorkspacePathRequest(filePath));
    },
    [toWorkspacePathRequest]
  );

  const openWorkspaceFile = useCallback(
    async (filePath: string): Promise<void> => {
      const content = await tnetApi.file.read(toWorkspacePathRequest(filePath));
      dispatch(openFile({ path: filePath, content }));
    },
    [dispatch, toWorkspacePathRequest]
  );

  const loadKeywordIndex = useCallback(async (): Promise<Record<string, string>> => {
    if (!rootPath) return {};
    return tnetApi.keyword.loadIndex(rootPath);
  }, [rootPath]);

  const getKeywordContent = useCallback(
    async (filePath: string, name: string): Promise<string | null> => {
      return tnetApi.keyword.getContent({ ...toWorkspacePathRequest(filePath), name });
    },
    [toWorkspacePathRequest]
  );

  const getInlineCompletion = useCallback(
    async (
      filePath: string,
      context: InlineCompletionContext
    ): Promise<InlineCompletionResult | null> => {
      if (!rootPath) return null;
      if (!settings.llmInlineCompletionEnabled) return null;
      if (context.trigger === 'automatic' && !settings.llmAutomaticTrigger) return null;
      return tnetApi.llm.getInlineCompletion({
        ...context,
        workspaceRoot: rootPath,
        filePath: toWorkspaceRelativePath(rootPath, filePath),
        language: 'markdown'
      });
    },
    [rootPath, settings.llmAutomaticTrigger, settings.llmInlineCompletionEnabled]
  );

  return {
    rootPath,
    hasWorkspace: Boolean(rootPath),
    readFile,
    writeFile,
    openFile: openWorkspaceFile,
    loadKeywordIndex,
    getKeywordContent,
    getInlineCompletion
  };
};
