import {
  startCompletion,
  type Completion,
  type CompletionContext,
  type CompletionResult
} from '@codemirror/autocomplete';
import type { EditorView } from '@codemirror/view';
import { toWorkspaceRelativePath } from '@tnet/shared/path/pathUtils';
import type { FileItem } from '@tnet/shared/types/file';
import { normalizeGlobalConfig } from '@tnet/shared/types/config';
import { getPdfViewerGlobalSettings } from '@tnet/app-pdf-viewer/shared/config';
import {
  encodePdfLinkPart,
  encodePdfRelativePath,
  normalizePdfRelativePath,
  workspaceNameForRoot
} from '@tnet/app-pdf-viewer/shared/pdfLink';
import { tnetApi } from '@tnet/renderer-core/tnetApi';

export interface PdfLinkCompletionWorkspace {
  workspaceName: string;
  rootPath: string;
  directories?: string[];
  files: string[];
}

export type PdfLinkCompletionIndexLoader = () => Promise<PdfLinkCompletionWorkspace[]>;

export const createPdfLinkCompletionIndexLoader = (
  cacheMs = 5000
): PdfLinkCompletionIndexLoader => {
  let cachedAt = 0;
  let cached: Promise<PdfLinkCompletionWorkspace[]> | null = null;

  return () => {
    const now = Date.now();
    if (cached && now - cachedAt < cacheMs) return cached;
    cachedAt = now;
    cached = loadPdfLinkCompletionIndex();
    return cached;
  };
};

export const pdfLinkCompletion =
  (loadIndex: PdfLinkCompletionIndexLoader) =>
  async (context: CompletionContext): Promise<CompletionResult | null> => {
    const match = context.matchBefore(/pdf:([^\s\])]*)$/);
    if (!match) return null;

    const index = await loadIndex();
    const typedTarget = match.text.slice('pdf:'.length);
    const slashIndex = typedTarget.indexOf('/');
    if (slashIndex === -1) {
      const typedWorkspace = decodePdfCompletionPart(typedTarget).toLowerCase();
      return {
        from: match.from + 'pdf:'.length,
        options: index
          .filter((workspace) => workspace.workspaceName.toLowerCase().startsWith(typedWorkspace))
          .map((workspace) => ({
            label: workspace.workspaceName,
            detail: workspace.rootPath,
            apply: applyPdfDirectoryCompletion(`${encodePdfLinkPart(workspace.workspaceName)}/`),
            type: 'folder' as const
          })),
        validFor: /^[^\s\])]*$/
      };
    }

    const typedWorkspace = decodePdfCompletionPart(typedTarget.slice(0, slashIndex));
    const typedPath = normalizePdfRelativePath(
      typedTarget
        .slice(slashIndex + 1)
        .split('/')
        .map(decodePdfCompletionPart)
        .join('/')
    ).toLowerCase();
    const matchingWorkspaces = index.filter(
      (workspace) => workspace.workspaceName === typedWorkspace
    );
    const pathFrom = match.from + 'pdf:'.length + slashIndex + 1;

    return {
      from: pathFrom,
      options: matchingWorkspaces.flatMap((workspace) => [
        ...(workspace.directories ?? [])
          .filter((directoryPath) => directoryPath.toLowerCase().startsWith(typedPath))
          .map((directoryPath) => ({
            label: `${directoryPath}/`,
            detail: workspace.rootPath,
            apply: applyPdfDirectoryCompletion(`${encodePdfRelativePath(directoryPath)}/`),
            type: 'folder' as const
          })),
        ...workspace.files
          .filter((filePath) => filePath.toLowerCase().startsWith(typedPath))
          .map((filePath) => ({
            label: filePath,
            detail: workspace.rootPath,
            apply: encodePdfRelativePath(filePath),
            type: 'file' as const
          }))
      ]),
      validFor: /^[^\s\])]*$/
    };
  };

const loadPdfLinkCompletionIndex = async (): Promise<PdfLinkCompletionWorkspace[]> => {
  const config = normalizeGlobalConfig(await tnetApi.config.loadGlobal());
  const settings = getPdfViewerGlobalSettings(config);
  const workspaces = await Promise.all(
    settings.workspaceRoots.map(async (rootPath) => {
      try {
        const fileTree = await tnetApi.workspace.getFileTree(rootPath);
        const entries = collectPdfLinkEntries(fileTree, rootPath);
        return {
          workspaceName: workspaceNameForRoot(rootPath),
          rootPath,
          directories: entries.directories,
          files: entries.files
        };
      } catch (error: unknown) {
        console.error('Failed to load PDF link completion index', error);
        return {
          workspaceName: workspaceNameForRoot(rootPath),
          rootPath,
          files: []
        };
      }
    })
  );

  return workspaces;
};

const collectPdfLinkEntries = (
  items: FileItem[],
  rootPath: string
): { directories: string[]; files: string[] } => {
  const entries = items.flatMap((item) => collectPdfLinkEntry(item, rootPath));
  return {
    directories: entries.flatMap((entry) => entry.directories),
    files: entries.flatMap((entry) => entry.files)
  };
};

const collectPdfLinkEntry = (
  item: FileItem,
  rootPath: string
): { directories: string[]; files: string[] } => {
  if (!item.isDirectory) {
    return {
      directories: [],
      files: item.name.toLowerCase().endsWith('.pdf')
        ? [normalizePdfRelativePath(toWorkspaceRelativePath(rootPath, item.path))]
        : []
    };
  }

  const childEntries = collectPdfLinkEntries(item.children ?? [], rootPath);
  const directoryPath = normalizePdfRelativePath(toWorkspaceRelativePath(rootPath, item.path));
  return {
    directories:
      childEntries.files.length > 0 && directoryPath
        ? [directoryPath, ...childEntries.directories]
        : childEntries.directories,
    files: childEntries.files
  };
};

const decodePdfCompletionPart = (value: string): string => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

export const applyPdfDirectoryCompletion =
  (insertText: string) =>
  (view: EditorView, _completion: Completion, from: number, to: number): void => {
    view.dispatch({
      changes: { from, to, insert: insertText },
      selection: { anchor: from + insertText.length }
    });
    startCompletion(view);
  };
