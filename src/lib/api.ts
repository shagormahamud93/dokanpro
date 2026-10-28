export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'
const TOKEN_KEY = 'dokanpro-token'

export class ApiError extends Error {
  status: number
  details?: unknown
  constructor(message: string, status: number, details?: unknown) {
    super(message)
    this.status = status
    this.details = details
  }
}

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
}

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown
  /** if true, do not redirect to /login on 401 (used by /auth/me bootstrap) */
  silent401?: boolean
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, headers, silent401, ...rest } = options
  const token = tokenStore.get()

  const res = await fetch(`${API_URL}${path}`, {
    ...rest,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  // 204 No Content
  if (res.status === 204) return undefined as T

  let json: { data?: T; error?: { message: string; details?: unknown } } = {}
  try {
    json = await res.json()
  } catch {
    /* empty body */
  }

  if (!res.ok) {
    if (res.status === 401 && !silent401) {
      tokenStore.clear()
      // dispatch so AuthContext can react without circular import
      window.dispatchEvent(new Event('auth:expired'))
    }
    if (res.status === 402) {
      // Subscription / billing problem — let the SubscriptionContext refetch
      window.dispatchEvent(
        new CustomEvent('subscription:required', { detail: json.error?.details ?? null }),
      )
    }
    throw new ApiError(
      json.error?.message || `Request failed (${res.status})`,
      res.status,
      json.error?.details,
    )
  }
  return json.data as T
}

export const api = {
  get: <T>(path: string, opts?: RequestOptions) => request<T>(path, { ...opts, method: 'GET' }),
  post: <T>(path: string, body?: unknown, opts?: RequestOptions) =>
    request<T>(path, { ...opts, method: 'POST', body }),
  put: <T>(path: string, body?: unknown, opts?: RequestOptions) =>
    request<T>(path, { ...opts, method: 'PUT', body }),
  del: <T>(path: string, opts?: RequestOptions) =>
    request<T>(path, { ...opts, method: 'DELETE' }),
}
