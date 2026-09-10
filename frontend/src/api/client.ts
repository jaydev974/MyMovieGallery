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

function getToken(): string | null {
  const persisted = localStorage.getItem('mmg-auth-v2');
  if (!persisted) return null;
  try {
    return (JSON.parse(persisted) as { state?: { token?: string } }).state?.token || null;
  } catch {
    return null;
  }
}

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  const token = getToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 15_000);
  if (init.signal) init.signal.addEventListener('abort', () => controller.abort(), { once: true });
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers, signal: controller.signal });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw new ApiError(408, 'The request timed out. Please try again.');
    throw new ApiError(0, 'Unable to reach the API. Check your connection and try again.');
  } finally {
    window.clearTimeout(timeout);
  }
  const data = await response.json().catch(() => null) as { detail?: string } | T | null;
  if (!response.ok) {
    const detail = data && typeof data === 'object' && 'detail' in data ? data.detail : undefined;
    if (response.status === 401) window.dispatchEvent(new CustomEvent('mmg:auth-expired'));
    throw new ApiError(response.status, typeof detail === 'string' ? detail : 'Request failed', response.headers.get('X-Request-ID') || undefined);
  }
  return data as T;
}

export const api = {
  get: <T>(path: string) => apiRequest<T>(path),
  post: <T>(path: string, body?: unknown) => apiRequest<T>(path, { method: 'POST', body: body === undefined ? undefined : JSON.stringify(body) }),
  put: <T>(path: string, body?: unknown) => apiRequest<T>(path, { method: 'PUT', body: body === undefined ? undefined : JSON.stringify(body) }),
  delete: <T>(path: string) => apiRequest<T>(path, { method: 'DELETE' }),
};