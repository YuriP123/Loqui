// Core API client with fetch wrapper + caching/dedup/retry

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface RequestOptions extends RequestInit {
  requiresAuth?: boolean;
  // Cache the successful JSON response for this many ms
  cacheTtlMs?: number;
  // If provided, concurrent identical requests share the same promise
  dedupeKey?: string;
}

/** In-memory caches (per tab) */
const responseCache = new Map<string, { expiresAt: number; data: any }>();
const inflightRequests = new Map<string, Promise<any>>();

/**
 * Clear cache for a specific endpoint or all caches matching a pattern
 */
export function clearCache(pattern?: string): void {
  if (!pattern) {
    // Clear all caches
    responseCache.clear();
    return;
  }
  
  // Clear caches matching the pattern
  for (const key of responseCache.keys()) {
    if (key.includes(pattern)) {
      responseCache.delete(key);
    }
  }
}

function buildDedupeKey(method: string, url: string, body?: any, customKey?: string) {
  if (customKey) return customKey;
  let bodyKey = '';
  if (typeof body === 'string') bodyKey = body;
  else if (body instanceof URLSearchParams) bodyKey = body.toString();
  else if (body && !(body instanceof FormData)) bodyKey = JSON.stringify(body);
  return `${method}:${url}:${bodyKey}`;
}

/**
 * Get the authentication token from localStorage
 */
export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('auth_token');
}

/**
 * Set the authentication token in localStorage
 */
export function setAuthToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('auth_token', token);
}

/**
 * Remove the authentication token from localStorage
 */
export function removeAuthToken(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('auth_token');
}

/** Basic retry with exponential backoff for transient failures */
async function retryWithBackoff<T>(fn: () => Promise<T>, shouldRetry: (e: any) => boolean, maxRetries = 2, baseDelay = 300): Promise<T> {
  let attempt = 0;
  let lastError: any;
  while (attempt <= maxRetries) {
    try {
      return await fn();
    } catch (e) {
      lastError = e;
      if (!shouldRetry(e) || attempt === maxRetries) break;
      const delay = baseDelay * Math.pow(2, attempt);
      await new Promise((r) => setTimeout(r, delay));
      attempt += 1;
    }
  }
  throw lastError;
}

/**
 * Core fetch wrapper with automatic token attachment, caching, and error handling
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { requiresAuth = true, headers = {}, cacheTtlMs, dedupeKey, ...fetchOptions } = options;

  const url = `${API_BASE_URL}${endpoint}`;

  const requestHeaders: Record<string, string> = {
    ...(headers as Record<string, string>),
  };

  const hasBody = !!fetchOptions.body;
  const hasContentType = Object.keys(requestHeaders).some(
    (h) => h.toLowerCase() === 'content-type'
  );
  if (
    hasBody &&
    !hasContentType &&
    !(fetchOptions.body instanceof FormData) &&
    !(fetchOptions.body instanceof URLSearchParams)
  ) {
    requestHeaders['Content-Type'] = 'application/json';
  }

  if (requiresAuth) {
    const token = getAuthToken();
    if (token) {
      requestHeaders['Authorization'] = `Bearer ${token}`;
    }
  }

  // Cache hit?
  const cacheKey = cacheTtlMs ? buildDedupeKey(fetchOptions.method || 'GET', url) : undefined;
  if (cacheKey && responseCache.has(cacheKey)) {
    const cached = responseCache.get(cacheKey)!;
    if (Date.now() < cached.expiresAt) {
      return cached.data as T;
    } else {
      responseCache.delete(cacheKey);
    }
  }

  // De-duplication for concurrent requests
  const inflightKey = buildDedupeKey(fetchOptions.method || 'GET', url, fetchOptions.body, dedupeKey);
  if (inflightRequests.has(inflightKey)) {
    return inflightRequests.get(inflightKey)! as Promise<T>;
  }

  const doFetch = async () => {
    const response = await fetch(url, {
      ...fetchOptions,
      headers: requestHeaders,
    });

    // Handle successful responses
    if (!response.ok) {
      // Try to parse error response
      let data: any;
      const contentType = response.headers.get('content-type');
      try {
        if (contentType && contentType.includes('application/json')) {
          data = await response.json();
        } else {
          data = await response.text();
        }
      } catch (e) {
        data = null;
      }
      
      const errorMessage = data?.detail || data?.message || `HTTP ${response.status}: ${response.statusText}`;
      throw new ApiError(errorMessage, response.status, data);
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return undefined as T;
    }

    // Try to parse successful response
    let data: any;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      data = text ? text : undefined;
    }

    // Cache store
    if (cacheKey && cacheTtlMs) {
      responseCache.set(cacheKey, { expiresAt: Date.now() + cacheTtlMs, data });
    }

    return data as T;
  };

  const shouldRetry = (e: any) => {
    if (e instanceof ApiError) {
      return e.status >= 500 && e.status < 600; // retry on server errors
    }
    // network TypeError etc.
    return true;
  };

  // Wrap network errors in ApiError for consistent handling
  const wrappedDoFetch = async () => {
    try {
      return await doFetch();
    } catch (e: any) {
      // If it's already an ApiError, rethrow it
      if (e instanceof ApiError) {
        throw e;
      }
      // Convert network errors to ApiError
      if (e instanceof TypeError && e.message.includes('fetch')) {
        throw new ApiError(
          'Cannot connect to server. Please make sure the backend is running on port 8000.',
          0,
          { originalError: e.message }
        );
      }
      // Other errors
      throw e;
    }
  };

  const promise = retryWithBackoff<T>(wrappedDoFetch, shouldRetry).finally(() => {
    inflightRequests.delete(inflightKey);
  });

  inflightRequests.set(inflightKey, promise);
  return promise;
}

/**
 * HTTP GET request
 */
export async function apiGet<T>(endpoint: string, options?: RequestOptions): Promise<T> {
  return apiRequest<T>(endpoint, { ...options, method: 'GET' });
}

/**
 * HTTP POST request
 */
export async function apiPost<T>(
  endpoint: string,
  body?: any,
  options?: RequestOptions
): Promise<T> {
  const finalBody =
    body instanceof FormData || body instanceof URLSearchParams || typeof body === 'string'
      ? body
      : JSON.stringify(body);

  return apiRequest<T>(endpoint, {
    ...options,
    method: 'POST',
    body: finalBody,
  });
}

/**
 * HTTP PUT request
 */
export async function apiPut<T>(
  endpoint: string,
  body?: any,
  options?: RequestOptions
): Promise<T> {
  const finalBody =
    body instanceof FormData || body instanceof URLSearchParams || typeof body === 'string'
      ? body
      : JSON.stringify(body);

  return apiRequest<T>(endpoint, {
    ...options,
    method: 'PUT',
    body: finalBody,
  });
}

/**
 * HTTP DELETE request
 */
export async function apiDelete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
  return apiRequest<T>(endpoint, { ...options, method: 'DELETE' });
}

/**
 * Download a file
 */
export async function apiDownload(endpoint: string): Promise<Blob> {
  const token = getAuthToken();
  const url = `${API_BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!response.ok) {
    throw new ApiError('Download failed', response.status);
  }

  return response.blob();
}

export { API_BASE_URL };

