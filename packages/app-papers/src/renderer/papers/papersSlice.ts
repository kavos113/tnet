import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { PaperDetail, PaperSummary } from '@tnet/app-papers/shared/paperTypes';

export type PapersDetailTab = 'metadata' | 'pdf' | 'note';

export interface PapersContentState {
  items: PaperSummary[];
  selectedPaperId: string;
  detail: PaperDetail | null;
  activeDetailTab: PapersDetailTab;
  isLoadingList: boolean;
  isLoadingDetail: boolean;
  error: string;
}

const initialState: PapersContentState = {
  items: [],
  selectedPaperId: '',
  detail: null,
  activeDetailTab: 'pdf',
  isLoadingList: false,
  isLoadingDetail: false,
  error: ''
};

const papersSlice = createSlice({
  name: 'papersContent',
  initialState,
  reducers: {
    setPapersListLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoadingList = action.payload;
    },
    setPapersDetailLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoadingDetail = action.payload;
    },
    setPapersError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
    },
    setPapers: (state, action: PayloadAction<PaperSummary[]>) => {
      state.items = action.payload;
      if (
        state.selectedPaperId &&
        !action.payload.some((paper) => paper.id === state.selectedPaperId)
      ) {
        state.selectedPaperId = '';
        state.detail = null;
      }
    },
    selectPaper: (state, action: PayloadAction<string>) => {
      state.selectedPaperId = action.payload;
      state.detail = null;
    },
    setPaperDetail: (state, action: PayloadAction<PaperDetail | null>) => {
      state.detail = action.payload;
    },
    setActivePapersDetailTab: (state, action: PayloadAction<PapersDetailTab>) => {
      state.activeDetailTab = action.payload;
    }
  }
});

export const {
  selectPaper,
  setActivePapersDetailTab,
  setPaperDetail,
  setPapers,
  setPapersDetailLoading,
  setPapersError,
  setPapersListLoading
} = papersSlice.actions;
export default papersSlice.reducer;
