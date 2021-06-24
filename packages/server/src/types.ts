import { CompleteResponse, ErrorResponse, Request, Response, ExtractPayload, UnsubscribeRequest, ObjectMapping, RequestMapper } from 'easyhard-bridge'
import { Observable } from 'rxjs'

export type Handler<T> = (
 payload: HandlerPayload<T>
) => Observable<ExtractPayload<T, 'response'>>

export type Handlers<T> = {
  [K in keyof T]: Handler<T[K]>
}

export type HandlerPayload<T> = ObjectMapping<ExtractPayload<T, 'request'>, RequestMapper, 0, 2>
export type RequestPayload<T> = ObjectMapping<ExtractPayload<T, 'request'>, RequestMapper, 0, 1>
export type RequestWithPayload<T> = (Omit<Request<T, keyof T>, 'payload'> & { payload: RequestPayload<T[keyof T]> })
export type SocketRequest<T> = RequestWithPayload<T> | UnsubscribeRequest
export type SocketResponse<T> = Response<T, keyof T> | ErrorResponse<unknown> | CompleteResponse
