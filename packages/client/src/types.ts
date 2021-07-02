import { CompleteResponse, ErrorResponse, ExtractPayload, ObjectMapping, Request, RequestMapper, Response, SubscribeResponse, UnsubscribeRequest } from 'easyhard-bridge'

export type ConnectionArgs = { http: string }
export type SocketResponse<T> = Response<T, keyof T> | CompleteResponse | ErrorResponse<unknown> | SubscribeResponse
export type SocketRequest<T> = JSONRequest<T> | UnsubscribeRequest
export type JSONPayload<T> = ObjectMapping<ExtractPayload<T, 'request'>, RequestMapper, 0, 1>
export type JSONRequest<T> = (Omit<Request<T, keyof T>, 'payload'> & { payload?: JSONPayload<T[keyof T]> })
