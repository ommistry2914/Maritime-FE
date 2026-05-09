import axios from "axios";
import type { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";
import { toast } from "sonner";
import type { ApiError } from "@/types/api.types";

const BASE_URL = import.meta.env.VITE_API_URL as string;

const axiosInstance: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 120000,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

let isRefreshing = false;
let refreshSubscribers: (() => void)[] = [];

const subscribeTokenRefresh = (callback: () => void): void => {
  refreshSubscribers.push(callback);
};

const onTokenRefreshed = (): void => {
  refreshSubscribers.forEach((callback) => callback());
  refreshSubscribers = [];
};

// ----- Response Interceptor -----
axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError<ApiError>) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

    if (originalRequest.skipAuthRefresh) {
      return Promise.reject(error);
    }

    if ((error.response?.status === 401 || error.response?.status === 403) && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve) => {
          subscribeTokenRefresh(() => {
            resolve(axiosInstance(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        await axios.post(`${BASE_URL}/auth/refresh`, {}, { withCredentials: true });
        onTokenRefreshed();
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        toast.error("Session expired. Please log in again.");
        refreshSubscribers = [];
        window.location.href = "#/login";
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    if (error.response?.status === 401) {
      window.location.href = "#/login";
    }

    if (error.response) {
      const message = error.response.data?.message || "Something went wrong!";
      toast.error(message);
    } else {
      toast.error("Network error. Please try again.");
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
