import type { CompletionContext, CompletionResult } from '@codemirror/autocomplete';
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
            apply: `${encodePdfLinkPart(workspace.workspaceName)}/`,
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

    return {
      from: match.from + 'pdf:'.length,
      options: matchingWorkspaces.flatMap((workspace) =>
        workspace.files
          .filter((filePath) => filePath.toLowerCase().startsWith(typedPath))
          .map((filePath) => ({
            label: filePath,
            detail: workspace.rootPath,
            apply: `${encodePdfLinkPart(workspace.workspaceName)}/${encodePdfRelativePath(filePath)}`,
            type: 'file' as const
          }))
      ),
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
        return {
          workspaceName: workspaceNameForRoot(rootPath),
          rootPath,
          files: collectPdfFiles(fileTree, rootPath)
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

const collectPdfFiles = (items: FileItem[], rootPath: string): string[] =>
  items.flatMap((item) => {
    if (item.isDirectory) return collectPdfFiles(item.children ?? [], rootPath);
    if (!item.name.toLowerCase().endsWith('.pdf')) return [];
    return normalizePdfRelativePath(toWorkspaceRelativePath(rootPath, item.path));
  });

const decodePdfCompletionPart = (value: string): string => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};
