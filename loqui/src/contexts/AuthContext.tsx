"use client";

// ============================================================================
// Authentication Context Provider
// ============================================================================

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { authApi, getErrorMessage } from "@/lib/api";
import { setAuthToken, removeAuthToken, getAuthToken, setUser, getUser, clearAuth } from "@/lib/auth";
import type { User, LoginResponse } from "@/types/api";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (data: { username: string; email: string; password: string; full_name?: string }) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  error: string | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize auth state on mount
  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      const token = getAuthToken();
      if (token) {
        // Try to get user data from localStorage first
        const cachedUser = getUser();
        if (cachedUser) {
          setUserState(cachedUser);
        }
        
        // Then fetch fresh data from API
        await refreshUser();
      }
    } catch (err) {
      console.error("Failed to initialize auth:", err);
      clearAuth();
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUser = async () => {
    try {
      const userData = await authApi.getCurrentUser();
      setUserState(userData);
      setUser(userData);
    } catch (err) {
      console.error("Failed to refresh user:", err);
      clearAuth();
      setUserState(null);
      throw err;
    }
  };

  const login = async (username: string, password: string) => {
    try {
      setError(null);
      setIsLoading(true);
      
      // Call login API
      const response: LoginResponse = await authApi.login(username, password);
      
      // Store token
      setAuthToken(response.access_token);
      
      // Fetch user data
      const userData = await authApi.getCurrentUser();
      setUserState(userData);
      setUser(userData);
      
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: { username: string; email: string; password: string; full_name?: string }) => {
    try {
      setError(null);
      setIsLoading(true);
      
      // Call register API
      await authApi.register(data);
      
      // Registration successful - user needs to login
      // Don't auto-login, let them go to signin page
      
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = useCallback(() => {
    clearAuth();
    setUserState(null);
    if (typeof window !== "undefined") {
      window.location.href = "/signin";
    }
  }, []);

  const clearError = () => {
    setError(null);
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    refreshUser,
    error,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook to use Auth Context
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

