import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { textByteLength } from '@tnet/shared/file/largeFile';
import { basename } from '@tnet/shared/path/pathUtils';
import type { ViewMode } from '@tnet/shared/types/viewMode';

export type EditorGroupId = 'primary' | 'secondary';

export interface OpenFile {
  path: string;
  content: string;
  sizeBytes: number;
  isModified: boolean;
  displayName: string;
}

export interface EditorGroupState {
  tabs: string[];
  activeIndex: number;
  viewMode: ViewMode;
  isPreviewOutlineVisible: boolean;
}

export interface PendingReveal {
  path: string;
  lineNumber: number;
  requestId: number;
  groupId: EditorGroupId;
}

export interface EditorState {
  filesByPath: Record<string, OpenFile>;
  groups: Record<EditorGroupId, EditorGroupState>;
  activeGroupId: EditorGroupId;
  isSecondaryGroupVisible: boolean;
  groupWidthPercent: number;
  openedFiles: OpenFile[];
  activeIndex: number;
  viewMode: ViewMode;
  isPreviewOutlineVisible: boolean;
  pendingReveal: PendingReveal | null;
}

const groupIds: EditorGroupId[] = ['primary', 'secondary'];

const createEmptyGroup = (): EditorGroupState => ({
  tabs: [],
  activeIndex: -1,
  viewMode: 'split',
  isPreviewOutlineVisible: true
});

const createFile = ({
  path,
  content,
  sizeBytes,
  isModified = false
}: {
  path: string;
  content: string;
  sizeBytes?: number;
  isModified?: boolean;
}): OpenFile => ({
  path,
  content,
  sizeBytes: sizeBytes ?? textByteLength(content),
  isModified,
  displayName: basename(path)
});

const initialState: EditorState = {
  filesByPath: {},
  groups: {
    primary: createEmptyGroup(),
    secondary: createEmptyGroup()
  },
  activeGroupId: 'primary',
  isSecondaryGroupVisible: false,
  groupWidthPercent: 50,
  openedFiles: [],
  activeIndex: -1,
  viewMode: 'split',
  isPreviewOutlineVisible: true,
  pendingReveal: null
};

let nextRevealRequestId = 1;

const clampActiveIndex = (group: EditorGroupState): void => {
  if (group.tabs.length === 0) {
    group.activeIndex = -1;
    return;
  }
  group.activeIndex = Math.min(Math.max(0, group.activeIndex), group.tabs.length - 1);
};

const getTargetGroupId = (state: EditorState, groupId: EditorGroupId | undefined): EditorGroupId =>
  groupId ?? state.activeGroupId;

const getActivePath = (state: EditorState, groupId: EditorGroupId): string | null => {
  const group = state.groups[groupId];
  if (group.activeIndex < 0 || group.activeIndex >= group.tabs.length) return null;
  return group.tabs[group.activeIndex] ?? null;
};

const removeUnreferencedFile = (state: EditorState, path: string): void => {
  const isStillOpen = groupIds.some((groupId) => state.groups[groupId].tabs.includes(path));
  if (!isStillOpen) {
    delete state.filesByPath[path];
  }
};

const syncLegacyActiveGroup = (state: EditorState): void => {
  if (!state.isSecondaryGroupVisible) {
    state.activeGroupId = 'primary';
  }

  const activeGroup = state.groups[state.activeGroupId];
  clampActiveIndex(activeGroup);
  state.openedFiles = activeGroup.tabs
    .map((path) => state.filesByPath[path])
    .filter((file): file is OpenFile => Boolean(file));
  state.activeIndex = activeGroup.activeIndex;
  state.viewMode = activeGroup.viewMode;
  state.isPreviewOutlineVisible = activeGroup.isPreviewOutlineVisible;
};

const normalizeGroups = (state: EditorState): void => {
  groupIds.forEach((groupId) => {
    const group = state.groups[groupId];
    group.tabs = group.tabs.filter((path, index) => {
      return Boolean(state.filesByPath[path]) && group.tabs.indexOf(path) === index;
    });
    clampActiveIndex(group);
  });

  if (state.groups.secondary.tabs.length === 0) {
    state.isSecondaryGroupVisible = false;
    if (state.activeGroupId === 'secondary') {
      state.activeGroupId = 'primary';
    }
  }

  syncLegacyActiveGroup(state);
};

const editorSlice = createSlice({
  name: 'editor',
  initialState,
  reducers: {
    openFile: (
      state,
      action: PayloadAction<{
        path: string;
        content: string;
        sizeBytes?: number;
        targetGroupId?: EditorGroupId;
      }>
    ) => {
      const groupId = getTargetGroupId(state, action.payload.targetGroupId);
      const group = state.groups[groupId];
      state.activeGroupId = groupId;

      if (groupId === 'secondary') {
        state.isSecondaryGroupVisible = true;
      }

      const existingIndex = group.tabs.indexOf(action.payload.path);
      if (existingIndex !== -1) {
        group.activeIndex = existingIndex;
        syncLegacyActiveGroup(state);
        return;
      }

      if (!state.filesByPath[action.payload.path]) {
        state.filesByPath[action.payload.path] = createFile(action.payload);
      }

      group.tabs.push(action.payload.path);
      group.activeIndex = group.tabs.length - 1;
      syncLegacyActiveGroup(state);
    },
    splitActiveTabRight: (state) => {
      const path = getActivePath(state, state.activeGroupId);
      if (!path) return;

      const secondary = state.groups.secondary;
      const existingIndex = secondary.tabs.indexOf(path);
      if (existingIndex === -1) {
        secondary.tabs.push(path);
        secondary.activeIndex = secondary.tabs.length - 1;
      } else {
        secondary.activeIndex = existingIndex;
      }
      state.isSecondaryGroupVisible = true;
      state.activeGroupId = 'secondary';
      syncLegacyActiveGroup(state);
    },
    closeSecondaryGroup: (state) => {
      const primary = state.groups.primary;
      const secondary = state.groups.secondary;
      const secondaryActivePath =
        secondary.activeIndex >= 0 && secondary.activeIndex < secondary.tabs.length
          ? secondary.tabs[secondary.activeIndex]
          : null;

      secondary.tabs.forEach((path) => {
        if (!primary.tabs.includes(path)) {
          primary.tabs.push(path);
        }
      });

      if (secondaryActivePath) {
        primary.activeIndex = primary.tabs.indexOf(secondaryActivePath);
      }
      clampActiveIndex(primary);
      state.groups.secondary = createEmptyGroup();
      state.isSecondaryGroupVisible = false;
      state.activeGroupId = 'primary';
      syncLegacyActiveGroup(state);
    },
    setActiveGroup: (state, action: PayloadAction<EditorGroupId>) => {
      if (action.payload === 'secondary' && !state.isSecondaryGroupVisible) return;
      state.activeGroupId = action.payload;
      syncLegacyActiveGroup(state);
    },
    setGroupWidthPercent: (state, action: PayloadAction<number>) => {
      state.groupWidthPercent = Math.min(Math.max(action.payload, 20), 80);
    },
    closeFile: (
      state,
      action: PayloadAction<number | { groupId?: EditorGroupId; index: number }>
    ) => {
      const payload =
        typeof action.payload === 'number'
          ? { groupId: state.activeGroupId, index: action.payload }
          : action.payload;
      const groupId = getTargetGroupId(state, payload.groupId);
      const group = state.groups[groupId];
      const index = payload.index;
      if (index < 0 || index >= group.tabs.length) return;

      const [removedPath] = group.tabs.splice(index, 1);
      if (group.tabs.length === 0) {
        group.activeIndex = -1;
      } else if (index <= group.activeIndex) {
        group.activeIndex = Math.max(0, group.activeIndex - 1);
      }

      if (groupId === state.activeGroupId && group.tabs.length === 0 && groupId === 'secondary') {
        state.activeGroupId = 'primary';
      }
      removeUnreferencedFile(state, removedPath);
      normalizeGroups(state);
    },
    closeFileByPath: (state, action: PayloadAction<string>) => {
      groupIds.forEach((groupId) => {
        const group = state.groups[groupId];
        const index = group.tabs.indexOf(action.payload);
        if (index === -1) return;

        group.tabs.splice(index, 1);
        if (group.tabs.length === 0) {
          group.activeIndex = -1;
        } else if (index <= group.activeIndex) {
          group.activeIndex = Math.max(0, group.activeIndex - 1);
        }
      });

      delete state.filesByPath[action.payload];
      normalizeGroups(state);
    },
    switchFile: (
      state,
      action: PayloadAction<number | { groupId?: EditorGroupId; index: number }>
    ) => {
      const payload =
        typeof action.payload === 'number'
          ? { groupId: state.activeGroupId, index: action.payload }
          : action.payload;
      const groupId = getTargetGroupId(state, payload.groupId);
      const group = state.groups[groupId];
      if (payload.index < 0 || payload.index >= group.tabs.length) return;
      group.activeIndex = payload.index;
      state.activeGroupId = groupId;
      syncLegacyActiveGroup(state);
    },
    updateActiveContent: (
      state,
      action: PayloadAction<string | { groupId?: EditorGroupId; content: string }>
    ) => {
      const payload =
        typeof action.payload === 'string'
          ? { groupId: state.activeGroupId, content: action.payload }
          : action.payload;
      const groupId = getTargetGroupId(state, payload.groupId);
      const activePath = getActivePath(state, groupId);
      if (!activePath) return;

      const activeFile = state.filesByPath[activePath];
      if (!activeFile) return;
      activeFile.content = payload.content;
      activeFile.sizeBytes = textByteLength(payload.content);
      activeFile.isModified = true;
      syncLegacyActiveGroup(state);
    },
    markActiveSaved: (
      state,
      action: PayloadAction<{
        content: string;
        path?: string;
        groupId?: EditorGroupId;
      }>
    ) => {
      const targetPath =
        action.payload.path ??
        getActivePath(state, getTargetGroupId(state, action.payload.groupId));
      if (!targetPath) return;

      const activeFile = state.filesByPath[targetPath];
      if (!activeFile) return;
      activeFile.content = action.payload.content;
      activeFile.sizeBytes = textByteLength(action.payload.content);
      activeFile.isModified = false;
      syncLegacyActiveGroup(state);
    },
    renameOpenedPath: (
      state,
      action: PayloadAction<{
        oldPath: string;
        newPath: string;
      }>
    ) => {
      const file = state.filesByPath[action.payload.oldPath];
      if (!file) return;

      delete state.filesByPath[action.payload.oldPath];
      state.filesByPath[action.payload.newPath] = {
        ...file,
        path: action.payload.newPath,
        displayName: basename(action.payload.newPath)
      };

      groupIds.forEach((groupId) => {
        const group = state.groups[groupId];
        group.tabs = group.tabs.map((path) =>
          path === action.payload.oldPath ? action.payload.newPath : path
        );
      });

      if (state.pendingReveal?.path === action.payload.oldPath) {
        state.pendingReveal.path = action.payload.newPath;
      }
      syncLegacyActiveGroup(state);
    },
    replaceOpenedFiles: (
      state,
      action: PayloadAction<{
        openedFiles: Array<{
          path: string;
          content: string;
          sizeBytes?: number;
        }>;
        activeIndex?: number;
      }>
    ) => {
      state.filesByPath = {};
      action.payload.openedFiles.forEach((file) => {
        state.filesByPath[file.path] = createFile(file);
      });
      state.groups.primary = {
        ...createEmptyGroup(),
        tabs: action.payload.openedFiles.map((file) => file.path),
        activeIndex:
          action.payload.openedFiles.length === 0
            ? -1
            : Math.min(action.payload.activeIndex ?? 0, action.payload.openedFiles.length - 1)
      };
      state.groups.secondary = createEmptyGroup();
      state.activeGroupId = 'primary';
      state.isSecondaryGroupVisible = false;
      syncLegacyActiveGroup(state);
    },
    replaceEditorSession: (
      state,
      action: PayloadAction<{
        files: Array<{
          path: string;
          content: string;
          sizeBytes?: number;
        }>;
        groups: Record<EditorGroupId, Partial<EditorGroupState> & { tabs: string[] }>;
        activeGroupId?: EditorGroupId;
        isSecondaryGroupVisible?: boolean;
        groupWidthPercent?: number;
      }>
    ) => {
      state.filesByPath = {};
      action.payload.files.forEach((file) => {
        state.filesByPath[file.path] = createFile(file);
      });
      state.groups.primary = {
        ...createEmptyGroup(),
        ...action.payload.groups.primary
      };
      state.groups.secondary = {
        ...createEmptyGroup(),
        ...action.payload.groups.secondary
      };
      state.activeGroupId = action.payload.activeGroupId ?? 'primary';
      state.isSecondaryGroupVisible =
        action.payload.isSecondaryGroupVisible ?? state.groups.secondary.tabs.length > 0;
      state.groupWidthPercent = action.payload.groupWidthPercent ?? 50;
      normalizeGroups(state);
    },
    setViewMode: (
      state,
      action: PayloadAction<ViewMode | { groupId?: EditorGroupId; viewMode: ViewMode }>
    ) => {
      const payload =
        typeof action.payload === 'string'
          ? { groupId: state.activeGroupId, viewMode: action.payload }
          : action.payload;
      const groupId = getTargetGroupId(state, payload.groupId);
      state.groups[groupId].viewMode = payload.viewMode;
      state.activeGroupId = groupId;
      syncLegacyActiveGroup(state);
    },
    togglePreviewOutline: (state, action: PayloadAction<EditorGroupId | undefined>) => {
      const groupId = getTargetGroupId(state, action.payload);
      state.groups[groupId].isPreviewOutlineVisible =
        !state.groups[groupId].isPreviewOutlineVisible;
      state.activeGroupId = groupId;
      syncLegacyActiveGroup(state);
    },
    requestRevealLine: (
      state,
      action: PayloadAction<{
        path: string;
        lineNumber: number;
        groupId?: EditorGroupId;
      }>
    ) => {
      const groupId = getTargetGroupId(state, action.payload.groupId);
      state.pendingReveal = {
        path: action.payload.path,
        lineNumber: action.payload.lineNumber,
        requestId: nextRevealRequestId,
        groupId
      };
      nextRevealRequestId += 1;
    },
    clearPendingReveal: (state, action: PayloadAction<number>) => {
      if (state.pendingReveal?.requestId === action.payload) {
        state.pendingReveal = null;
      }
    }
  }
});

export const {
  openFile,
  splitActiveTabRight,
  closeSecondaryGroup,
  setActiveGroup,
  setGroupWidthPercent,
  closeFile,
  closeFileByPath,
  switchFile,
  updateActiveContent,
  markActiveSaved,
  renameOpenedPath,
  replaceOpenedFiles,
  replaceEditorSession,
  requestRevealLine,
  clearPendingReveal,
  setViewMode,
  togglePreviewOutline
} = editorSlice.actions;
export default editorSlice.reducer;
