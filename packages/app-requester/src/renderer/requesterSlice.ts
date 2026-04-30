import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type {
  RequesterRequestDetail,
  RequesterRequestSummary,
  RequesterResponseSnapshot,
  RequesterHistoryEntry,
  RequesterWorkspace
} from '@tnet/app-requester/shared/requesterTypes';
import type { RequesterWorkspaceSettings } from '@tnet/app-requester/shared/config';
import { defaultRequesterWorkspaceSettings } from '@tnet/app-requester/shared/config';

interface RequesterState {
  activeWorkspaceId?: string;
  activeRequestId?: string;
  activeRequest?: RequesterRequestDetail;
  activeResponse?: RequesterResponseSnapshot;
  workspaces: RequesterWorkspace[];
  requests: RequesterRequestSummary[];
  history: RequesterHistoryEntry[];
  settings: RequesterWorkspaceSettings;
  isRestored: boolean;
  error?: string;
}

const initialState: RequesterState = {
  workspaces: [],
  requests: [],
  history: [],
  settings: defaultRequesterWorkspaceSettings(),
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
      }>
    ) => {
      state.activeWorkspaceId = action.payload.activeWorkspaceId;
      state.workspaces = action.payload.workspaces;
      state.requests = action.payload.requests ?? [];
      state.history = action.payload.history ?? [];
      state.settings = action.payload.settings ?? defaultRequesterWorkspaceSettings();
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
      }>
    ) => {
      state.activeWorkspaceId = action.payload.activeWorkspaceId;
      state.activeRequestId = undefined;
      state.activeRequest = undefined;
      state.workspaces = action.payload.workspaces;
      state.requests = action.payload.requests ?? [];
      state.history = action.payload.history ?? [];
      state.settings = action.payload.settings ?? defaultRequesterWorkspaceSettings();
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
    },
    setRequesterResponse: (state, action: PayloadAction<RequesterResponseSnapshot | undefined>) => {
      state.activeResponse = action.payload;
    },
    setRequesterError: (state, action: PayloadAction<string | undefined>) => {
      state.error = action.payload;
    }
  }
});

export const {
  restoreRequester,
  setActiveRequesterRequest,
  setRequesterError,
  setRequesterHistory,
  setRequesterRequests,
  setRequesterResponse,
  setRequesterWorkspace
} = requesterSlice.actions;
export default requesterSlice.reducer;
