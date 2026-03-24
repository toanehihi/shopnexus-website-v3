import { ErrorCode, ResponseError, SuccessPaginationRes, SuccessResponse } from './response.type'

const BASE_URL = 'https://shopnexus.hopto.org/api/v1/'

const headers: Record<string, string> = {
  'Content-Type': 'application/json',
}

const _process = { env: { NODE_ENV: '', NEXT_PUBLIC_TOKEN: '' } as Record<string, string | undefined> }

if (_process.env.NODE_ENV === 'development' && globalThis?.localStorage && _process.env.NEXT_PUBLIC_TOKEN?.length) {
  console.warn(`Development mode: Using local storage token ${_process.env.NEXT_PUBLIC_TOKEN}`)
  globalThis?.localStorage?.setItem?.('token', _process.env.NEXT_PUBLIC_TOKEN ?? '')
}

export async function customFetch<TResponse = unknown>(
  url: string,
  options: RequestInit = {},
) {
  // prepare auth header from current access token
  const token = globalThis?.localStorage?.getItem?.('token')
  if (token?.length) {
    headers.Authorization = `Bearer ${token}`
  } else {
    headers.Authorization = ''
  }

  const resolvedUrl = resolveUrl(BASE_URL, url)

  // small helper to run the actual request (allows retry after refresh)
  async function runRequest(): Promise<Response> {
    const requestHeaders: Record<string, string> = { ...headers, ...options.headers as Record<string, string> }

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
      const newToken = globalThis?.localStorage?.getItem?.('token')
      if (newToken?.length) {
        headers.Authorization = `Bearer ${newToken}`
      }
      response = await runRequest()
    }
  }

  // try reading json safely
  let data: unknown = undefined
  try {
    data = await response.json()
  } catch {
    // ignore json parse errors (e.g., 204 No Content)
  }


  if (hasErrorEnvelope(data)) {
    throw new ResponseError(data.error.code, data.error.message)
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

// Helper function to resolve URLs
function resolveUrl(base: string, path: string): string {
  return new URL(path, base).toString()
}

// Attempt to refresh access token using refresh token. Returns true if succeeded
async function tryRefreshTokens(): Promise<boolean> {
  try {
    const refreshToken = globalThis?.localStorage?.getItem?.('refresh_token')
    if (!refreshToken?.length) return false

    const response = await fetch(resolveUrl(BASE_URL, 'auth/refresh'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
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

// Type guard for API error envelope
function hasErrorEnvelope(
  value: unknown,
): value is { error: { code: ErrorCode; message: string } } {
  if (typeof value !== 'object' || value === null) return false
  const maybe = value as Record<string, unknown>
  if (!('error' in maybe)) return false
  const err = maybe.error as unknown
  if (typeof err !== 'object' || err === null) return false
  const errObj = err as Record<string, unknown>
  return 'code' in errObj
}
