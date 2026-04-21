export type PaginationParams<TEntity = Record<string, any>> = {
  page?: number
  cursor?: string
  limit: number
  order?: 'asc' | 'desc'
  sortBy?: keyof TEntity
} & {
  [K in keyof TEntity]?: TEntity[K]
}
export type SuccessResponse<Data = any> = {
  data: Data
}

export type SuccessPaginationRes<Item> = SuccessResponse<Item[]> & {
  pagination: {
    total: number
    page?: number
    cursor?: string
    limit: number
    next_page?: number
    next_cursor?: string
  }
}

export class ResponseError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
  ) {
    super(message)
    Object.setPrototypeOf(this, ResponseError.prototype)
  }

  get isUnauthorized() {
    return this.statusCode === 401
  }
}

/**
 * Detects the backend's `address_country_mismatch` error on create/update
 * contact or buyer checkout.
 */
export function isAddressCountryMismatch(err: unknown): boolean {
  return err instanceof ResponseError && err.code === "address_country_mismatch"
}

/**
 * Detects the backend's `wallet_not_empty` 409 returned by
 * `PATCH /profile/country` when the wallet has a non-zero balance.
 */
export function isWalletNotEmpty(err: unknown): boolean {
  return err instanceof ResponseError && err.code === "wallet_not_empty"
}

/**
 * Parses the resolved and profile (or buyer) country ISO codes out of
 * an `address_country_mismatch` error message, e.g.
 *
 *   "address_country_mismatch: address resolves to US, profile country is VN"
 *   "address_country_mismatch: address resolves to US, buyer country is VN"
 *
 * Returns `null` for either side if it cannot be parsed, so callers can
 * still show a generic message.
 */
export function parseAddressCountryMismatch(
  err: unknown,
): { resolvedCountry: string | null; profileCountry: string | null } | null {
  if (!isAddressCountryMismatch(err)) return null
  const match = (err as ResponseError).message.match(
    /address resolves to ([A-Za-z]{2}),\s*(?:profile|buyer) country is ([A-Za-z]{2})/,
  )
  if (!match) {
    return { resolvedCountry: null, profileCountry: null }
  }
  return {
    resolvedCountry: match[1].toUpperCase(),
    profileCountry: match[2].toUpperCase(),
  }
}
