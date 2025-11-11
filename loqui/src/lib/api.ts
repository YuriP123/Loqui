// ============================================================================
// API Client Configuration with Axios
// ============================================================================

import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from "axios";
import { getAuthToken, clearAuth, isTokenExpired } from "./auth";
import type { ApiError } from "@/types/api";

// API Base URL - from environment variable or default to localhost
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const API_TIMEOUT = parseInt(process.env.NEXT_PUBLIC_API_TIMEOUT || "30000");

/**
 * Create Axios instance with default configuration
 */
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * Request Interceptor - Add auth token to requests
 */
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAuthToken();
    
    // Check if token is expired
    if (token && isTokenExpired(token)) {
      clearAuth();
      if (typeof window !== "undefined") {
        window.location.href = "/signin?expired=1";
      }
      return Promise.reject(new Error("Token expired"));
    }
    
    // Add Authorization header if token exists
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Response Interceptor - Handle errors globally
 */
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error: AxiosError<ApiError>) => {
    // Handle 401 Unauthorized - clear auth and redirect to login
    if (error.response?.status === 401) {
      clearAuth();
      if (typeof window !== "undefined") {
        window.location.href = "/signin?unauthorized=1";
      }
    }
    
    // Handle network errors
    if (!error.response) {
      console.error("Network error:", error.message);
    }
    
    return Promise.reject(error);
  }
);

/**
 * Helper function to extract error message from API response
 */
export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const apiError = error.response?.data as ApiError | undefined;
    
    if (apiError?.detail) {
      if (typeof apiError.detail === "string") {
        return apiError.detail;
      } else if (Array.isArray(apiError.detail)) {
        return apiError.detail.map(err => err.msg).join(", ");
      }
    }
    
    return error.message || "An unexpected error occurred";
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return "An unexpected error occurred";
}

// ============================================================================
// API Service Functions
// ============================================================================

/**
 * Authentication API
 */
export const authApi = {
  register: async (data: { username: string; email: string; password: string; full_name?: string }) => {
    const response = await apiClient.post("/api/auth/register", data);
    return response.data;
  },
  
  login: async (username: string, password: string) => {
    // Login endpoint expects form-data
    const formData = new FormData();
    formData.append("username", username);
    formData.append("password", password);
    
    const response = await apiClient.post("/api/auth/login", formData, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });
    return response.data;
  },
  
  getCurrentUser: async () => {
    const response = await apiClient.get("/api/auth/me");
    return response.data;
  },
};

/**
 * Audio Samples API
 */
export const samplesApi = {
  list: async (skip = 0, limit = 100) => {
    const response = await apiClient.get(`/api/samples/?skip=${skip}&limit=${limit}`);
    return response.data;
  },
  
  get: async (sampleId: number) => {
    const response = await apiClient.get(`/api/samples/${sampleId}`);
    return response.data;
  },
  
  upload: async (data: { sample_name: string; upload_type: string; file: File }) => {
    const formData = new FormData();
    formData.append("sample_name", data.sample_name);
    formData.append("upload_type", data.upload_type);
    formData.append("file", data.file);
    
    const response = await apiClient.post("/api/samples/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },
  
  delete: async (sampleId: number) => {
    const response = await apiClient.delete(`/api/samples/${sampleId}`);
    return response.data;
  },
};

/**
 * Voice Generation API
 */
export const generationApi = {
  create: async (data: { sample_id: number; model_name: string; script_text: string }) => {
    const response = await apiClient.post("/api/generation/create", data);
    return response.data;
  },
  
  getStatus: async (audioId: number) => {
    const response = await apiClient.get(`/api/generation/status/${audioId}`);
    return response.data;
  },
  
  get: async (audioId: number) => {
    const response = await apiClient.get(`/api/generation/${audioId}`);
    return response.data;
  },
  
  list: async (skip = 0, limit = 100, statusFilter?: string) => {
    let url = `/api/generation/?skip=${skip}&limit=${limit}`;
    if (statusFilter) {
      url += `&status_filter=${statusFilter}`;
    }
    const response = await apiClient.get(url);
    return response.data;
  },
  
  delete: async (audioId: number) => {
    const response = await apiClient.delete(`/api/generation/${audioId}`);
    return response.data;
  },
  
  retry: async (audioId: number) => {
    const response = await apiClient.post(`/api/generation/${audioId}/retry`);
    return response.data;
  },
};

/**
 * Library API
 */
export const libraryApi = {
  getAll: async (skip = 0, limit = 100) => {
    const response = await apiClient.get(`/api/library/all?skip=${skip}&limit=${limit}`);
    return response.data;
  },
  
  getSamples: async (skip = 0, limit = 100) => {
    const response = await apiClient.get(`/api/library/samples?skip=${skip}&limit=${limit}`);
    return response.data;
  },
  
  getGenerated: async (skip = 0, limit = 100) => {
    const response = await apiClient.get(`/api/library/generated?skip=${skip}&limit=${limit}`);
    return response.data;
  },
  
  download: async (itemType: "sample" | "generated", itemId: number) => {
    const response = await apiClient.get(`/api/library/download/${itemType}/${itemId}`, {
      responseType: "blob",
    });
    return response.data;
  },
  
  getDownloadUrl: (itemType: "sample" | "generated", itemId: number) => {
    const token = getAuthToken();
    return `${API_BASE_URL}/api/library/download/${itemType}/${itemId}?token=${token}`;
  },
  
  delete: async (itemType: "sample" | "generated", itemId: number) => {
    const response = await apiClient.delete(`/api/library/${itemType}/${itemId}`);
    return response.data;
  },
};

/**
 * Health Check API
 */
export const healthApi = {
  check: async () => {
    const response = await apiClient.get("/health");
    return response.data;
  },
};

export default apiClient;

