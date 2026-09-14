import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export type Locale = 'en' | 'hi';
export interface UiState {
  locale: Locale;
  selectedFarmId: string;
}

const initialState: UiState = { locale: 'en', selectedFarmId: '' };

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setLocale(state, action: PayloadAction<Locale>) {
      state.locale = action.payload;
    },
    selectFarm(state, action: PayloadAction<string>) {
      state.selectedFarmId = action.payload;
    },
    clearSelectedFarm(state) {
      state.selectedFarmId = '';
    },
  },
});

export const { setLocale, selectFarm, clearSelectedFarm } = uiSlice.actions;
export const uiReducer = uiSlice.reducer;
