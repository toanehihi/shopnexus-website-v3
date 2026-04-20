const TOKEN_KEY = 'token'
const REFRESH_TOKEN_KEY = 'refresh_token'

// Dispatched after tokens change so same-tab subscribers can refresh.
// Cross-tab changes are already observable via the native 'storage' event.
export const AUTH_CHANGE_EVENT = 'auth-change'

const isBrowser = typeof window !== 'undefined'

export type AuthTokens = {
  access_token: string
  refresh_token: string
}

export function getAccessToken(): string | null {
  return isBrowser ? localStorage.getItem(TOKEN_KEY) : null
}

export function getRefreshToken(): string | null {
  return isBrowser ? localStorage.getItem(REFRESH_TOKEN_KEY) : null
}

export function saveAuthTokens(tokens: AuthTokens): void {
  if (!isBrowser) return
  localStorage.setItem(TOKEN_KEY, tokens.access_token)
  localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh_token)
  window.dispatchEvent(new Event(AUTH_CHANGE_EVENT))
}

export function clearAuthTokens(): void {
  if (!isBrowser) return
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
  window.dispatchEvent(new Event(AUTH_CHANGE_EVENT))
}

export function subscribeAuthChange(callback: () => void): () => void {
  if (!isBrowser) return () => {}
  const onStorage = (e: StorageEvent) => {
    if (e.key === TOKEN_KEY || e.key === REFRESH_TOKEN_KEY) callback()
  }
  window.addEventListener('storage', onStorage)
  window.addEventListener(AUTH_CHANGE_EVENT, callback)
  return () => {
    window.removeEventListener('storage', onStorage)
    window.removeEventListener(AUTH_CHANGE_EVENT, callback)
  }
}
