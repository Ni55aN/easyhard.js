export type RequestId = string
export type ExtractPayload<T, K extends 'request' | 'response'> = T extends { [key in K]: unknown } ? T[K] : (T extends { [key in K]?: unknown } ? T[K] : undefined)
export type Request<T, K extends keyof T> = { action: K, id: RequestId, payload: ExtractPayload<T[K], 'request'> }
export type UnsubscribeRequest = { id: RequestId, unsubscribe: true }
export type Response<T, K extends keyof T> = { id: RequestId, payload: ExtractPayload<T[K], 'response'>, cookie?: string }
export type CompleteResponse = { id: RequestId, complete: true }
export type ErrorResponse<T> = { id: RequestId, error: T }

export class Cookie {
  constructor(public key: string) {}
}

export * from './utility-types'
