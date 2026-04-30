import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type {
  RequesterRequestSummary,
  RequesterWorkspace
} from '@tnet/app-requester/shared/requesterTypes';

interface RequesterState {
  activeWorkspaceId?: string;
  workspaces: RequesterWorkspace[];
  requests: RequesterRequestSummary[];
  isRestored: boolean;
}

const initialState: RequesterState = {
  workspaces: [],
  requests: [],
  isRestored: false
};

const requesterSlice = createSlice({
  name: 'requester',
  initialState,
  reducers: {
    restoreRequester: (
      state,
      action: PayloadAction<{ activeWorkspaceId?: string; workspaces: RequesterWorkspace[] }>
    ) => {
      state.activeWorkspaceId = action.payload.activeWorkspaceId;
      state.workspaces = action.payload.workspaces;
      state.isRestored = true;
    },
    setRequesterRequests: (state, action: PayloadAction<RequesterRequestSummary[]>) => {
      state.requests = action.payload;
    }
  }
});

export const { restoreRequester, setRequesterRequests } = requesterSlice.actions;
export default requesterSlice.reducer;
