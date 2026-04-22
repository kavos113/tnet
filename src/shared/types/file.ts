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

export interface SessionData {
  openedFiles: string[];
  expandedFolders: string[];
  editorLayout?: SessionEditorLayout;
}
