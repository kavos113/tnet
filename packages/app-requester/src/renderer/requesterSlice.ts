import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type {
  RequesterExecutionErrorSnapshot,
  RequesterRequestDetail,
  RequesterRequestSummary,
  RequesterResponseSnapshot,
  RequesterHistoryEntry,
  RequesterWorkspace
} from '@tnet/app-requester/shared/requesterTypes';
import type {
  RequesterGlobalSettings,
  RequesterWorkspaceSettings
} from '@tnet/app-requester/shared/config';
import {
  defaultRequesterGlobalSettings,
  defaultRequesterWorkspaceSettings
} from '@tnet/app-requester/shared/config';

interface RequesterState {
  activeWorkspaceId?: string;
  activeRequestId?: string;
  activeRequest?: RequesterRequestDetail;
  activeRequestFolderPath?: string;
  activeResponse?: RequesterResponseSnapshot;
  activeResponseError?: RequesterExecutionErrorSnapshot;
  workspaces: RequesterWorkspace[];
  requests: RequesterRequestSummary[];
  history: RequesterHistoryEntry[];
  settings: RequesterWorkspaceSettings;
  globalSettings: RequesterGlobalSettings;
  isRestored: boolean;
  error?: string;
}

const initialState: RequesterState = {
  workspaces: [],
  requests: [],
  history: [],
  settings: defaultRequesterWorkspaceSettings(),
  globalSettings: defaultRequesterGlobalSettings(),
  isRestored: false
};

const requesterSlice = createSlice({
  name: 'requester',
  initialState,
  reducers: {
    restoreRequester: (
      state,
      action: PayloadAction<{
        activeWorkspaceId?: string;
        workspaces: RequesterWorkspace[];
        requests?: RequesterRequestSummary[];
        history?: RequesterHistoryEntry[];
        settings?: RequesterWorkspaceSettings;
        globalSettings?: RequesterGlobalSettings;
      }>
    ) => {
      state.activeWorkspaceId = action.payload.activeWorkspaceId;
      state.workspaces = action.payload.workspaces;
      state.requests = action.payload.requests ?? [];
      state.history = action.payload.history ?? [];
      state.settings = action.payload.settings ?? defaultRequesterWorkspaceSettings();
      state.globalSettings = action.payload.globalSettings ?? defaultRequesterGlobalSettings();
      state.activeRequestFolderPath = undefined;
      state.isRestored = true;
    },
    setRequesterWorkspace: (
      state,
      action: PayloadAction<{
        activeWorkspaceId?: string;
        workspaces: RequesterWorkspace[];
        requests?: RequesterRequestSummary[];
        history?: RequesterHistoryEntry[];
        settings?: RequesterWorkspaceSettings;
        globalSettings?: RequesterGlobalSettings;
      }>
    ) => {
      state.activeWorkspaceId = action.payload.activeWorkspaceId;
      state.activeRequestId = undefined;
      state.activeRequest = undefined;
      state.activeRequestFolderPath = undefined;
      state.workspaces = action.payload.workspaces;
      state.requests = action.payload.requests ?? [];
      state.history = action.payload.history ?? [];
      state.settings = action.payload.settings ?? defaultRequesterWorkspaceSettings();
      state.globalSettings = action.payload.globalSettings ?? state.globalSettings;
      state.isRestored = true;
    },
    setRequesterRequests: (state, action: PayloadAction<RequesterRequestSummary[]>) => {
      state.requests = action.payload;
    },
    setRequesterHistory: (state, action: PayloadAction<RequesterHistoryEntry[]>) => {
      state.history = action.payload;
    },
    setActiveRequesterRequest: (
      state,
      action: PayloadAction<RequesterRequestDetail | undefined>
    ) => {
      state.activeRequest = action.payload;
      state.activeRequestId = action.payload?.id;
      state.activeResponse = undefined;
      state.activeResponseError = undefined;
    },
    setRequesterResponse: (state, action: PayloadAction<RequesterResponseSnapshot | undefined>) => {
      state.activeResponse = action.payload;
      if (action.payload) state.activeResponseError = undefined;
    },
    setRequesterResponseError: (
      state,
      action: PayloadAction<RequesterExecutionErrorSnapshot | undefined>
    ) => {
      state.activeResponseError = action.payload;
      if (action.payload) state.activeResponse = undefined;
    },
    setRequesterSettings: (state, action: PayloadAction<RequesterWorkspaceSettings>) => {
      state.settings = action.payload;
    },
    setRequesterGlobalSettings: (state, action: PayloadAction<RequesterGlobalSettings>) => {
      state.globalSettings = {
        ...defaultRequesterGlobalSettings(),
        ...action.payload
      };
    },
    setActiveRequesterFolder: (state, action: PayloadAction<string | undefined>) => {
      state.activeRequestFolderPath = action.payload;
    },
    setRequesterError: (state, action: PayloadAction<string | undefined>) => {
      state.error = action.payload;
    }
  }
});

export const {
  restoreRequester,
  setActiveRequesterFolder,
  setActiveRequesterRequest,
  setRequesterError,
  setRequesterGlobalSettings,
  setRequesterHistory,
  setRequesterRequests,
  setRequesterResponse,
  setRequesterResponseError,
  setRequesterSettings,
  setRequesterWorkspace
} = requesterSlice.actions;
export default requesterSlice.reducer;
