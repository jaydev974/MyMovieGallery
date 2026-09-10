export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

export class ApiError extends Error {
  status: number;
  requestId?: string;

  constructor(status: number, message: string, requestId?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.requestId = requestId;
  }
}

interface ApiRequestOptions {
  suppressAuthExpired?: boolean;
}

function getToken(): string | null {
  const keys = ['mmg-auth-v3', 'mmg-auth-v2'];
  for (const key of keys) {
    const persisted = localStorage.getItem(key);
    if (!persisted) continue;
    try {
      const token = (JSON.parse(persisted) as { state?: { token?: string } }).state?.token;
      if (token) return token;
    } catch {
      // Ignore malformed persisted state and try the next key.
    }
  }
  return null;
}

function isRetriableStatus(status: number): boolean {
  return status === 502 || status === 503 || status === 504;
}

function canRetryRequest(init: RequestInit): boolean {
  const method = (init.method || 'GET').toUpperCase();
  return method === 'GET' || method === 'HEAD';
}

function getNetworkErrorMessage(): string {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return 'You appear to be offline. Please reconnect and try again.';
  }
  return 'Unable to reach the API. Check your connection and try again.';
}

async function fetchWithRetry(input: RequestInfo | URL, init: RequestInit, attempts: number): Promise<Response> {
  let lastError: unknown;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const response = await fetch(input, init);
      if (!response.ok && isRetriableStatus(response.status) && attempt < attempts - 1) {
        await new Promise((resolve) => window.setTimeout(resolve, 250 * (attempt + 1)));
        continue;
      }
      return response;
    } catch (error) {
      lastError = error;
      if (attempt < attempts - 1) {
        await new Promise((resolve) => window.setTimeout(resolve, 250 * (attempt + 1)));
        continue;
      }
      throw error;
    }
  }
  throw lastError instanceof Error ? lastError : new Error('Request failed');
}

export async function apiRequest<T>(path: string, init: RequestInit = {}, options: ApiRequestOptions = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  const token = getToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 15_000);
  if (init.signal) init.signal.addEventListener('abort', () => controller.abort(), { once: true });

  const retryAttempts = canRetryRequest(init) ? 3 : 1;
  let response: Response;

  try {
    response = await fetchWithRetry(`${API_BASE_URL}${path}`, { ...init, headers, credentials: 'include', signal: controller.signal }, retryAttempts);
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new ApiError(408, 'The request timed out. Please try again.');
    }
    throw new ApiError(0, getNetworkErrorMessage());
  } finally {
    window.clearTimeout(timeout);
  }

  const contentType = response.headers.get('Content-Type') || '';
  const expectsJson = contentType.includes('application/json') || contentType.includes('+json');
  const data = expectsJson ? await response.json().catch(() => null) : null;

  if (!response.ok) {
    const detail = data && typeof data === 'object' && 'detail' in data ? data.detail : undefined;
    if (response.status === 401 && !options.suppressAuthExpired) window.dispatchEvent(new CustomEvent('mmg:auth-expired'));
    throw new ApiError(response.status, typeof detail === 'string' ? detail : 'Request failed', response.headers.get('X-Request-ID') || undefined);
  }

  return (data as T) ?? (undefined as T);
}

export const api = {
  get: <T>(path: string, options?: ApiRequestOptions) => apiRequest<T>(path, {}, options),
  post: <T>(path: string, body?: unknown, options?: ApiRequestOptions) => apiRequest<T>(path, { method: 'POST', body: body === undefined ? undefined : JSON.stringify(body) }, options),
  put: <T>(path: string, body?: unknown, options?: ApiRequestOptions) => apiRequest<T>(path, { method: 'PUT', body: body === undefined ? undefined : JSON.stringify(body) }, options),
  delete: <T>(path: string, options?: ApiRequestOptions) => apiRequest<T>(path, { method: 'DELETE' }, options),
};