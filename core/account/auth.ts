import { useMutation } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useEffect, useSyncExternalStore } from 'react'
import { getQueryClient } from '@/lib/queryclient/query-client'
import { customFetchStandard } from '@/lib/queryclient/custom-fetch'

// ===== Auth State =====

const AUTH_CHANGE = 'auth-change'

function notifyAuthChange() {
  globalThis?.dispatchEvent?.(new Event(AUTH_CHANGE))
}

function getToken() {
  return globalThis?.localStorage?.getItem?.('token') ?? null
}

function subscribeToken(callback: () => void) {
  // Cross-tab: StorageEvent fires when another tab changes localStorage
  const onStorage = (e: StorageEvent) => { if (e.key === 'token') callback() }
  // Same-tab: custom event fired by saveAuthTokens / removeAuthTokens
  const onAuth = () => callback()
  window.addEventListener('storage', onStorage)
  window.addEventListener(AUTH_CHANGE, onAuth)
  return () => {
    window.removeEventListener('storage', onStorage)
    window.removeEventListener(AUTH_CHANGE, onAuth)
  }
}

export function useIsAuthenticated(): boolean {
  const token = useSyncExternalStore(subscribeToken, getToken, () => null)
  return !!token?.length
}

export function useRequireAuth() {
  const isAuthenticated = useIsAuthenticated()
  const router = useRouter()
  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login')
    }
  }, [isAuthenticated, router])
  return isAuthenticated
}

// ===== Helpers =====

const saveAuthTokens = (data: { access_token: string; refresh_token: string }) => {
  // TODO: save to httpOnly cookie instead
  globalThis?.localStorage?.setItem?.('token', data.access_token)
  globalThis?.localStorage?.setItem?.('refresh_token', data.refresh_token)
  notifyAuthChange()
}

const removeAuthTokens = () => {
  globalThis?.localStorage?.removeItem?.('token')
  globalThis?.localStorage?.removeItem?.('refresh_token')
  notifyAuthChange()
}

// ===== Hooks =====
export const useRegisterBasic = () =>
  useMutation({
    mutationFn: async (params: {
      username?: string | null
      email?: string | null
      phone?: string | null
      password: string
    }) => customFetchStandard<{
      access_token: string
      refresh_token: string
    }>('account/auth/register/basic', {
      method: 'POST',
      body: JSON.stringify(params),
    }),
    onSuccess: saveAuthTokens,
  })

export const useLoginBasic = () =>
  useMutation({
    mutationFn: async (params: {
      id: string
      password: string
    }) => customFetchStandard<{
      access_token: string
      refresh_token: string
    }>('account/auth/login/basic', {
      method: 'POST',
      body: JSON.stringify(params),
    }),
    onSuccess: saveAuthTokens,
  })

export const useRefreshToken = () =>
  useMutation({
    mutationFn: async (params: {
      refresh_token: string
    }) => customFetchStandard<{
      access_token: string
      refresh_token: string
    }>('account/auth/refresh', {
      method: 'POST',
      body: JSON.stringify(params),
    }),
    onSuccess: saveAuthTokens,
  })

export const useSignOut = () =>
  useMutation({
    mutationFn: async () => {
      removeAuthTokens()

      const queryClient = getQueryClient()
      await queryClient.setQueryData(['account', 'me'], null)
      return Promise.resolve()
    },
    onSuccess: async () => {
      await getQueryClient().invalidateQueries({ queryKey: ['account', 'me'] })
    },
  })


