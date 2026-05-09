import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit"
import type { RootState } from "./store";
import axiosInstance from "@/api/axiosInstance";
import type { AuthState, LoginCredentials, LoginResponse, RegisterCredentials } from "@/types/auth.types";
import type { ApiResponse } from "@/types/api.types";

export const register = createAsyncThunk<
  LoginResponse,
  RegisterCredentials,
  { rejectValue: string }
>("auth/register", async (data, { rejectWithValue }) => {
  try {
    const response = await axiosInstance.post<ApiResponse<LoginResponse>>(
      "/auth/register",
      data
    );

    return response.data.data;
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.message || "Registration failed. Please try again."
    );
  }
});

export const login = createAsyncThunk<
  LoginResponse,
  LoginCredentials,
  { rejectValue: string }
>("auth/login", async (credentials, { rejectWithValue }) => {
  try {
    const response = await axiosInstance.post<ApiResponse<LoginResponse>>(
      "/auth/login",
      credentials
    );

    return response.data.data;
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.message || "Login failed. Please try again."
    );
  }
});

export const fetchCurrentUser = createAsyncThunk<
  LoginResponse,
  void,
  { rejectValue: string }
>("auth/fetchCurrentUser", async (_, { rejectWithValue }) => {
  try {
    const response = await axiosInstance.get<ApiResponse<LoginResponse>>(
      "/auth/me",
      { skipAuthRefresh: true }
    );

    return response.data.data;
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.message || "Not authenticated"
    );
  }
});

export const logout = createAsyncThunk("auth/logout", async () => {
  await axiosInstance.post("/auth/logout", {});
  return true;
});


const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  initialized: false,
  loading: false,
  error: null,
};


const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    resetError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
    
      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(register.fulfilled, (state, action: PayloadAction<LoginResponse>) => {
        state.loading = false;
        state.user = action.payload.user;
        state.isAuthenticated = true;
        state.initialized = true;
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Registration failed";
      })

      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action: PayloadAction<LoginResponse>) => {
        state.loading = false;
        state.user = action.payload.user;
        state.isAuthenticated = true;
        state.initialized = true;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Login failed";
      })

      .addCase(
        fetchCurrentUser.fulfilled,
        (state, action: PayloadAction<LoginResponse>) => {
          state.user = action.payload.user;
          state.isAuthenticated = true;
          state.initialized = true;
        }
      )
      .addCase(fetchCurrentUser.rejected, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.initialized = true;
      })

      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.initialized = true;
      });
  },
});

export const { resetError } = authSlice.actions;
export default authSlice.reducer;

// Selector
export const selectAuth = (state: RootState) => state.auth;
