export interface FileItem {
  name: string;
  path: string;
  isDirectory: boolean;
  children?: FileItem[];
}

export type SessionEditorGroupId = 'primary' | 'secondary';

export interface SessionEditorGroup {
  openedFiles: string[];
  activeIndex: number;
  viewMode: 'editor' | 'preview' | 'split';
  isPreviewOutlineVisible: boolean;
}

export interface SessionEditorLayout {
  activeGroupId: SessionEditorGroupId;
  isSecondaryGroupVisible: boolean;
  groupWidthPercent: number;
  groups: Record<SessionEditorGroupId, SessionEditorGroup>;
}

export interface MarkdownSession {
  openedFiles: string[];
  editorLayout?: SessionEditorLayout;
}

export interface WorkspaceExplorerSession {
  expandedFolders: string[];
  selectedPath?: string;
}

export interface SessionData {
  explorer: WorkspaceExplorerSession;
  apps: {
    markdown: MarkdownSession;
  };
}

export const emptySessionData = (): SessionData => ({
  explorer: {
    expandedFolders: []
  },
  apps: {
    markdown: {
      openedFiles: []
    }
  }
});

export const normalizeSessionData = (session: unknown): SessionData => {
  if (!session || typeof session !== 'object' || Array.isArray(session)) return emptySessionData();

  const candidate = session as Partial<SessionData>;
  const explorer = (candidate.explorer ?? {}) as Partial<WorkspaceExplorerSession>;
  const markdown = (candidate.apps?.markdown ?? {}) as Partial<MarkdownSession>;

  return {
    explorer: {
      expandedFolders: Array.isArray(explorer.expandedFolders) ? explorer.expandedFolders : [],
      selectedPath: typeof explorer.selectedPath === 'string' ? explorer.selectedPath : undefined
    },
    apps: {
      markdown: {
        openedFiles: Array.isArray(markdown.openedFiles) ? markdown.openedFiles : [],
        editorLayout: markdown.editorLayout
      }
    }
  };
};
