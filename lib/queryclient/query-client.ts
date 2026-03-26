import {
  defaultShouldDehydrateQuery,
  isServer,
  MutationCache,
  QueryCache,
  QueryClient,
} from '@tanstack/react-query'
import { ResponseError } from './response.type'

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        refetchOnWindowFocus: false,
        staleTime: 60 * 1000,
      },
      dehydrate: {
        shouldDehydrateQuery: query =>
          defaultShouldDehydrateQuery(query)
          || query.state.status === 'pending',
        shouldRedactErrors: () => false,
      },
    },
    queryCache: new QueryCache({
      onError(error: unknown) {
        // 401 redirect is already handled in customFetch
        // This catches any other global query errors if needed
        if (error instanceof ResponseError && error.isUnauthorized) {
          return // already redirecting in customFetch
        }
      },
    }),
    mutationCache: new MutationCache({
      onError(error: unknown) {
        if (error instanceof ResponseError && error.isUnauthorized) {
          return // already redirecting in customFetch
        }
      },
    }),
  })
}

let browserQueryClient: QueryClient | undefined = undefined

export function getQueryClient() {
  if (isServer) {
    return makeQueryClient()
  }
  else {
    browserQueryClient ??= makeQueryClient()
    return browserQueryClient
  }
}
