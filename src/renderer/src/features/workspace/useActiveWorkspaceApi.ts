import { useCallback } from 'react';
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
}

export const useActiveWorkspaceApi = (): ActiveWorkspaceApi => {
  const dispatch = useAppDispatch();
  const rootPath = useAppSelector((state) => state.workspace.rootPath);

  const writeFile = useCallback(
    async (filePath: string, content: string): Promise<void> => {
      if (!rootPath) return;
      await tnetApi.file.write(filePath, content, rootPath);
    },
    [rootPath]
  );

  const readFile = useCallback(async (filePath: string): Promise<string> => {
    return tnetApi.file.read(filePath);
  }, []);

  const openWorkspaceFile = useCallback(
    async (filePath: string): Promise<void> => {
      const content = await tnetApi.file.read(filePath);
      dispatch(openFile({ path: filePath, content }));
    },
    [dispatch]
  );

  const loadKeywordIndex = useCallback(async (): Promise<Record<string, string>> => {
    if (!rootPath) return {};
    return tnetApi.keyword.loadIndex(rootPath);
  }, [rootPath]);

  const getKeywordContent = useCallback(
    async (filePath: string, name: string): Promise<string | null> => {
      return tnetApi.keyword.getContent(filePath, name);
    },
    []
  );

  return {
    rootPath,
    hasWorkspace: Boolean(rootPath),
    readFile,
    writeFile,
    openFile: openWorkspaceFile,
    loadKeywordIndex,
    getKeywordContent
  };
};
