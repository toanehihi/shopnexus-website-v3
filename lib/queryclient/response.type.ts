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
