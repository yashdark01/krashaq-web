import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface SessionIdentity {
  sub: string;
  tenantId: string;
  role: 'user' | 'admin';
  expiresAt: string;
}
export type AuthStatus = 'checking' | 'authenticated' | 'anonymous';
export interface AuthState {
  status: AuthStatus;
  identity?: SessionIdentity;
}

const initialState: AuthState = { status: 'checking' };
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    checkingSession(state) {
      state.status = 'checking';
    },
    authenticated(state, action: PayloadAction<SessionIdentity>) {
      state.status = 'authenticated';
      state.identity = action.payload;
    },
    anonymous(state) {
      state.status = 'anonymous';
      delete state.identity;
    },
  },
});

export const { checkingSession, authenticated, anonymous } = authSlice.actions;
export const authReducer = authSlice.reducer;
