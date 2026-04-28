import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { defaultAppId, isAppId, type AppId } from '@shared/app/appTypes';

interface AppState {
  activeAppId: AppId;
}

const initialState: AppState = {
  activeAppId: defaultAppId
};

const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    setActiveApp: (state, action: PayloadAction<AppId>) => {
      state.activeAppId = action.payload;
    },
    restoreActiveApp: (state, action: PayloadAction<string | undefined>) => {
      state.activeAppId = isAppId(action.payload) ? action.payload : defaultAppId;
    }
  }
});

export const { restoreActiveApp, setActiveApp } = appSlice.actions;
export default appSlice.reducer;
