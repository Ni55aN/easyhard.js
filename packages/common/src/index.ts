export type RequestId = string
export type ExtractPayload<T, K extends 'request' | 'response'> = T extends { [key in K]: unknown } ? T[K] : (T extends { [key in K]?: unknown } ? T[K] : undefined)
export type Request<T, K extends keyof T> = { action: K, id: RequestId, payload?: ExtractPayload<T[K], 'request'> }
export type Response<T, K extends keyof T> = { id: RequestId, payload: ExtractPayload<T[K], 'response'> }
export type CompleteResponse = { id: RequestId, complete: true }
