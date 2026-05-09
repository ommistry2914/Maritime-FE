import axios from "axios";
import type { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";
import { toast } from "sonner";
import type { ApiError } from "@/types/api.types";

const BASE_URL = import.meta.env.VITE_API_URL as string;

// ── Axios instance ───────────────────────────────────────────────
const axiosInstance: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 120000,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// ── Store reference (set lazily to break circular dep) ───────────
// We import the store AFTER it is created by calling injectStore()
// from main.tsx — this avoids the axios ↔ store circular import.
let _dispatch: ((action: any) => void) | null = null;

export function injectStore(dispatch: (action: any) => void) {
  _dispatch = dispatch;
}

// ── Refresh-queue state ──────────────────────────────────────────
let isRefreshing = false;
let refreshQueue: Array<(retry: boolean) => void> = [];

function resolveQueue(success: boolean) {
  refreshQueue.forEach((cb) => cb(success));
  refreshQueue = [];
}

// ── Silent force-logout (no page reload, no duplicate toasts) ────
let sessionExpiredShown = false;

function handleSessionExpired(message = "Session expired. Please log in again.") {
  isRefreshing = false;
  resolveQueue(false);

  // Only show toast once per expiry event
  if (!sessionExpiredShown) {
    sessionExpiredShown = true;
    toast.error(message);
    // Reset flag after a short delay so next genuine expiry shows again
    setTimeout(() => { sessionExpiredShown = false; }, 3000);
  }

  // Dispatch forceLogout through Redux — React Router then redirects
  // via the route guards in AppRoute.tsx (no window.location reload)
  if (_dispatch) {
    // Dynamic import to avoid circular dependency at module load time
    import("@/slice/auth.slice").then(({ forceLogout }) => {
      _dispatch!(forceLogout());
    });
  }
}

// ── Response interceptor ─────────────────────────────────────────
axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => response,

  async (error: AxiosError<ApiError>) => {
    const originalRequest = error.config as AxiosRequestConfig & {
      _retry?: boolean;
      skipAuthRefresh?: boolean;
    };

    const status = error.response?.status;

    // ── 1. Skip refresh for requests that opted out ──────────────
    if (originalRequest?.skipAuthRefresh) {
      return Promise.reject(error);
    }

    // ── 2. Handle 401 / 403 with token refresh ───────────────────
    if ((status === 401 || status === 403) && !originalRequest?._retry) {
      originalRequest._retry = true;

      // If a refresh is already in flight, queue this request
      if (isRefreshing) {
        return new Promise<AxiosResponse>((resolve, reject) => {
          refreshQueue.push((success) => {
            if (success) {
              resolve(axiosInstance(originalRequest));
            } else {
              reject(error);
            }
          });
        });
      }

      isRefreshing = true;

      try {
        // Call /auth/refresh — uses httpOnly cookie automatically
        await axios.post(
          `${BASE_URL}/auth/refresh`,
          {},
          { withCredentials: true, skipAuthRefresh: true } as any
        );

        // Refresh succeeded — retry all queued requests
        resolveQueue(true);
        isRefreshing = false;
        return axiosInstance(originalRequest);

      } catch {
        // Refresh failed — force logout silently via Redux
        handleSessionExpired();
        return Promise.reject(error);
      }
    }

    // ── 3. Generic error toasts (skip 401 — already handled) ────
    // Don't show a toast if this is a 401 that we already handled above
    // (_retry is set, meaning we already went through the refresh path)
    if (originalRequest?._retry) {
      // This is a retried request that still failed — already logged out above
      return Promise.reject(error);
    }

    if (error.response) {
      const message = error.response.data?.message || "Something went wrong.";
      // Don't show session-expired toast for regular API errors
      if (status !== 401 && status !== 403) {
        toast.error(message);
      }
    } else if (error.request) {
      toast.error("Network error. Please check your connection.");
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
