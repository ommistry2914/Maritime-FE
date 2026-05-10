import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "./store";
import axiosInstance from "@/api/axiosInstance";
import type { AuthState, LoginCredentials, LoginResponse, RegisterCredentials } from "@/types/auth.types";
import type { ApiResponse } from "@/types/api.types";

// ── Async Thunks ─────────────────────────────────────────────────

export const register = createAsyncThunk<LoginResponse, RegisterCredentials, { rejectValue: string }>(
  "auth/register",
  async (data, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post<ApiResponse<LoginResponse>>("/auth/register", data);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Registration failed. Please try again.");
    }
  }
);

export const login = createAsyncThunk<LoginResponse, LoginCredentials, { rejectValue: string }>(
  "auth/login",
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post<ApiResponse<LoginResponse>>("/auth/login", credentials);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Login failed. Please try again.");
    }
  }
);

export const fetchCurrentUser = createAsyncThunk<LoginResponse, void, { rejectValue: string }>(
  "auth/fetchCurrentUser",
  async (_, { rejectWithValue }) => {
    try {
      // _isSessionCheck tells the interceptor this is a background page-load check.
      // If /auth/me → 401 → /auth/refresh → 401, the interceptor will silently log
      // out without showing "Session expired" toast (user was never logged in).
      // If the access token is merely expired, the interceptor refreshes it first
      // and retries /auth/me automatically.
      const response = await axiosInstance.get<ApiResponse<LoginResponse>>("/auth/me", {
        _isSessionCheck: true,
      } as any);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Not authenticated");
    }
  }
);

export const logout = createAsyncThunk("auth/logout", async () => {
  try {
    // Call logout endpoint — ignore errors (cookie will be cleared server-side)
    const refreshToken = localStorage.getItem('refreshToken');
    await axiosInstance.post("/auth/logout", { refreshToken }, { skipAuthRefresh: true } as any);
  } catch {
    // swallow — we still want to clear local state
  }
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  return true;
});

// ── Initial State ────────────────────────────────────────────────

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  initialized: false,
  loading: false,
  error: null,
};

// ── Slice ────────────────────────────────────────────────────────

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    resetError: (state) => {
      state.error = null;
    },
    /**
     * forceLogout — called by the axios interceptor when refresh fails.
     * Clears auth state WITHOUT hitting the network, so no new requests fire.
     */
    forceLogout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.initialized = true;
      state.loading = false;
      state.error = null;
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
    },
  },
  extraReducers: (builder) => {
    builder
      // register
      .addCase(register.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(register.fulfilled, (state, action: PayloadAction<LoginResponse>) => {
        state.loading = false;
        state.user = action.payload.user;
        state.isAuthenticated = true;
        state.initialized = true;
        if (action.payload.accessToken) localStorage.setItem("accessToken", action.payload.accessToken);
        if (action.payload.refreshToken) localStorage.setItem("refreshToken", action.payload.refreshToken);
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Registration failed";
      })

      // login
      .addCase(login.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(login.fulfilled, (state, action: PayloadAction<LoginResponse>) => {
        state.loading = false;
        state.user = action.payload.user;
        state.isAuthenticated = true;
        state.initialized = true;
        if (action.payload.accessToken) localStorage.setItem("accessToken", action.payload.accessToken);
        if (action.payload.refreshToken) localStorage.setItem("refreshToken", action.payload.refreshToken);
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Login failed";
      })

      // fetchCurrentUser
      .addCase(fetchCurrentUser.fulfilled, (state, action: PayloadAction<LoginResponse>) => {
        state.user = action.payload.user;
        state.isAuthenticated = true;
        state.initialized = true;
        if (action.payload.accessToken) localStorage.setItem("accessToken", action.payload.accessToken);
        if (action.payload.refreshToken) localStorage.setItem("refreshToken", action.payload.refreshToken);
      })
      .addCase(fetchCurrentUser.rejected, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.initialized = true;
      })

      // logout
      .addCase(logout.pending, (state) => { state.loading = true; })
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.initialized = true;
        state.loading = false;
      })
      .addCase(logout.rejected, (state) => {
        // Even if the API call fails, clear the local state
        state.user = null;
        state.isAuthenticated = false;
        state.initialized = true;
        state.loading = false;
      });
  },
});

export const { resetError, forceLogout } = authSlice.actions;
export default authSlice.reducer;

// Selectors
export const selectAuth = (state: RootState) => state.auth;
