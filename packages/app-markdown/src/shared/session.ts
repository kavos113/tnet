export type ViewMode = 'editor' | 'preview' | 'split';

export type SessionEditorGroupId = 'primary' | 'secondary';

export interface SessionEditorGroup {
  openedFiles: string[];
  activeIndex: number;
  viewMode: ViewMode;
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

export interface MarkdownSessionData {
  explorer: WorkspaceExplorerSession;
  apps: {
    markdown: MarkdownSession;
  };
}

export const emptyMarkdownSessionData = (): MarkdownSessionData => ({
  explorer: {
    expandedFolders: []
  },
  apps: {
    markdown: {
      openedFiles: []
    }
  }
});

export const normalizeMarkdownSessionData = (session: unknown): MarkdownSessionData => {
  if (!session || typeof session !== 'object' || Array.isArray(session)) {
    return emptyMarkdownSessionData();
  }

  const candidate = session as Partial<MarkdownSessionData>;
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
