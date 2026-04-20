import { clearAuthTokens, getAccessToken, getRefreshToken, saveAuthTokens } from './auth-storage'
import { ResponseError, SuccessPaginationRes, SuccessResponse } from './response.type'

const BASE_URL = 'https://shopnexus.hopto.org/api/v1/'

export async function customFetch<TResponse = unknown>(
  url: string,
  options: RequestInit = {},
): Promise<TResponse> {
  const resolvedUrl = new URL(url, BASE_URL).toString()

  const send = () => fetch(resolvedUrl, { ...options, headers: buildHeaders(options) })

  let response = await send()

  if (response.status === 401) {
    if (!(await refreshSession())) {
      clearAuthTokens()
      throw new ResponseError(401, 'auth.expired', 'Session expired. Please log in again.')
    }
    response = await send()
  }

  const data = await parseJsonSafe(response)

  if (hasErrorEnvelope(data)) {
    throw new ResponseError(response.status, data.error.code, data.error.message)
  }

  if (!response.ok) {
    throw new ResponseError(response.status, 'unknown', `Request failed with status ${response.status}`)
  }

  return data as TResponse
}

export async function customFetchStandard<Data = unknown>(url: string, options: RequestInit = {}) {
  const response = await customFetch<SuccessResponse<Data>>(url, options)
  return response.data
}

export async function customFetchPagination<Data = unknown>(url: string, options: RequestInit = {}) {
  return customFetch<SuccessPaginationRes<Data>>(url, options)
}

function buildHeaders(options: RequestInit): Record<string, string> {
  const token = getAccessToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string>),
  }
  // Let the browser set Content-Type (with boundary) for FormData
  if (options.body instanceof FormData) delete headers['Content-Type']
  return headers
}

async function parseJsonSafe(response: Response): Promise<unknown> {
  try {
    return await response.json()
  } catch {
    return undefined
  }
}

// Deduplicate concurrent refreshes — the refresh token is single-use,
// so multiple 401s must share one in-flight refresh promise.
let inflightRefresh: Promise<boolean> | null = null

function refreshSession(): Promise<boolean> {
  inflightRefresh ??= doRefresh().finally(() => {
    inflightRefresh = null
  })
  return inflightRefresh
}

async function doRefresh(): Promise<boolean> {
  const refreshToken = getRefreshToken()
  if (!refreshToken) return false

  try {
    const response = await fetch(new URL('account/auth/refresh', BASE_URL).toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    })
    if (!response.ok) return false

    const body = (await response.json()) as SuccessResponse<{
      access_token: string
      refresh_token: string
    }>
    const tokens = body?.data
    if (!tokens?.access_token || !tokens?.refresh_token) return false

    saveAuthTokens(tokens)
    return true
  } catch {
    return false
  }
}

function hasErrorEnvelope(value: unknown): value is { error: { code: string; message: string } } {
  if (typeof value !== 'object' || value === null) return false
  const err = (value as { error?: unknown }).error
  return typeof err === 'object' && err !== null && 'code' in err
}
