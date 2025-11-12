// Authentication API endpoints

import { apiGet, apiPost } from '../api-client';
import type { LoginRequest, LoginResponse, RegisterRequest, User } from '../api-types';

/**
 * Register a new user
 * POST /api/auth/register
 */
export async function register(data: RegisterRequest): Promise<User> {
  return apiPost<User>('/api/auth/register', data, { requiresAuth: false });
}

/**
 * Login user and get access token
 * POST /api/auth/login
 */
export async function login(data: LoginRequest): Promise<LoginResponse> {
  // Backend expects form data for login
  const formData = new URLSearchParams();
  formData.append('username', data.username);
  formData.append('password', data.password);

  return apiPost<LoginResponse>('/api/auth/login', formData, {
    requiresAuth: false,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });
}

/**
 * Get current authenticated user
 * GET /api/auth/me
 */
export async function getCurrentUser(): Promise<User> {
  return apiGet<User>('/api/auth/me');
}

/**
 * Logout current user
 * POST /api/auth/logout
 */
export async function logout(): Promise<void> {
  return apiPost<void>('/api/auth/logout', {});
}

