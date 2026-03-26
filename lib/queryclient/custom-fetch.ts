import { ResponseError, SuccessPaginationRes, SuccessResponse } from './response.type'

const BASE_URL = 'https://shopnexus.hopto.org/api/v1/'

const defaultHeaders: Record<string, string> = {
  'Content-Type': 'application/json',
}

export async function customFetch<TResponse = unknown>(
  url: string,
  options: RequestInit = {},
) {
  const resolvedUrl = resolveUrl(BASE_URL, url)

  async function runRequest(): Promise<Response> {
    const token = globalThis?.localStorage?.getItem?.('token')
    const requestHeaders: Record<string, string> = {
      ...defaultHeaders,
      ...(token?.length ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers as Record<string, string>,
    }

    // Let the browser set Content-Type for FormData (includes boundary)
    if (options.body instanceof FormData) {
      delete requestHeaders['Content-Type']
    }

    return fetch(resolvedUrl, {
      ...options,
      headers: requestHeaders,
    })
  }

  // attempt the request once
  let response = await runRequest()

  // if unauthorized, try to refresh once and retry
  if (response.status === 401) {
    const refreshed = await tryRefreshTokens()
    if (refreshed) {
      response = await runRequest()
    } else {
      // Refresh failed — clear tokens and redirect to login
      clearAuth()
      if (typeof window !== 'undefined') {
        window.location.href = '/login'
      }
      throw new ResponseError(401, 'auth.expired', 'Session expired. Please log in again.')
    }
  }

  // If still 401 after refresh retry (e.g., new token also expired)
  if (response.status === 401) {
    clearAuth()
    if (typeof window !== 'undefined') {
      window.location.href = '/login'
    }
    throw new ResponseError(401, 'auth.expired', 'Session expired. Please log in again.')
  }

  // try reading json safely
  let data: unknown = undefined
  try {
    data = await response.json()
  } catch {
    // ignore json parse errors (e.g., 204 No Content)
  }

  if (hasErrorEnvelope(data)) {
    throw new ResponseError(response.status, data.error.code, data.error.message)
  }

  if (!response.ok) {
    throw new ResponseError(response.status, 'unknown', `Request failed with status ${response.status}`)
  }

  return data as TResponse
}

export async function customFetchStandard<Data = unknown>(
  url: string,
  options: RequestInit = {},
) {
  const response = await customFetch<SuccessResponse<Data>>(url, options)
  return response.data
}

export async function customFetchPagination<Data = unknown>(
  url: string,
  options: RequestInit = {},
) {
  return customFetch<SuccessPaginationRes<Data>>(url, options)
}

function resolveUrl(base: string, path: string): string {
  return new URL(path, base).toString()
}

function clearAuth() {
  globalThis?.localStorage?.removeItem?.('token')
  globalThis?.localStorage?.removeItem?.('refresh_token')
}

async function tryRefreshTokens(): Promise<boolean> {
  try {
    const refreshToken = globalThis?.localStorage?.getItem?.('refresh_token')
    if (!refreshToken?.length) return false

    const response = await fetch(resolveUrl(BASE_URL, 'account/auth/refresh'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    })

    if (!response.ok) return false
    const data = (await response.json()) as SuccessResponse<{
      access_token: string
      refresh_token: string
    }>

    const newAccess = data?.data?.access_token
    const newRefresh = data?.data?.refresh_token
    if (!newAccess?.length || !newRefresh?.length) return false

    globalThis?.localStorage?.setItem?.('token', newAccess)
    globalThis?.localStorage?.setItem?.('refresh_token', newRefresh)
    return true
  } catch {
    return false
  }
}

function hasErrorEnvelope(
  value: unknown,
): value is { error: { code: string; message: string } } {
  if (typeof value !== 'object' || value === null) return false
  const maybe = value as Record<string, unknown>
  if (!('error' in maybe)) return false
  const err = maybe.error as unknown
  if (typeof err !== 'object' || err === null) return false
  const errObj = err as Record<string, unknown>
  return 'code' in errObj
}
