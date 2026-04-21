import { useMutation } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  clearAuthTokens,
  getAccessToken,
  saveAuthTokens,
  subscribeAuthChange,
} from '@/lib/queryclient/auth-storage'
import { customFetchStandard } from '@/lib/queryclient/custom-fetch'
import { getQueryClient } from '@/lib/queryclient/query-client'

// ===== Auth state hooks =====

// Returns `undefined` during the hydration render (before localStorage is read),
// then `boolean` thereafter. Callers passing this to `enabled:` must coerce
// with `!!` so TanStack Query's default of `true` doesn't fire user-scoped
// queries before auth state is known.
export function useIsAuthenticated(): boolean | undefined {
  const [token, setToken] = useState<string | null | undefined>(undefined)

  useEffect(() => {
    setToken(getAccessToken())
    return subscribeAuthChange(() => setToken(getAccessToken()))
  }, [])

  return token === undefined ? undefined : !!token
}

export function useRequireAuth(): boolean | undefined {
  const isAuthenticated = useIsAuthenticated()
  const router = useRouter()

  useEffect(() => {
    if (isAuthenticated === false) router.replace('/login')
  }, [isAuthenticated, router])

  return isAuthenticated
}

// ===== Auth mutations =====

type AuthCredResponse = { access_token: string; refresh_token: string }

export const useRegisterBasic = () =>
  useMutation({
    mutationFn: (params: {
      username?: string | null
      email?: string | null
      phone?: string | null
      password: string
      country: string
    }) =>
      customFetchStandard<AuthCredResponse>('account/auth/register/basic', {
        method: 'POST',
        body: JSON.stringify(params),
      }),
    onSuccess: saveAuthTokens,
  })

export const useLoginBasic = () =>
  useMutation({
    mutationFn: (params: { id: string; password: string }) =>
      customFetchStandard<AuthCredResponse>('account/auth/login/basic', {
        method: 'POST',
        body: JSON.stringify(params),
      }),
    onSuccess: saveAuthTokens,
  })

export const useRefreshToken = () =>
  useMutation({
    mutationFn: (params: { refresh_token: string }) =>
      customFetchStandard<AuthCredResponse>('account/auth/refresh', {
        method: 'POST',
        body: JSON.stringify(params),
      }),
    onSuccess: saveAuthTokens,
  })

export const useSignOut = () =>
  useMutation({
    mutationFn: async () => {
      clearAuthTokens()
      getQueryClient().setQueryData(['account', 'me'], null)
    },
    onSuccess: () =>
      getQueryClient().invalidateQueries({ queryKey: ['account', 'me'] }),
  })
