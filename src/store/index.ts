import { configureStore } from '@reduxjs/toolkit';
import { authReducer } from '@/features/auth/auth.slice';
import { uiReducer } from '@/features/ui/ui.slice';
import { api } from '@/lib/api/platform.api';

export const makeStore = () =>
  configureStore({
    reducer: {
      auth: authReducer,
      ui: uiReducer,
      [api.reducerPath]: api.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(api.middleware),
  });

export type Store = ReturnType<typeof makeStore>;
export type RootState = ReturnType<Store['getState']>;
export type AppDispatch = Store['dispatch'];
