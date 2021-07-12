import { CompleteResponse, ErrorResponse, Request, Response, ExtractPayload, UnsubscribeRequest, ObjectMapping, RequestMapper, ResponseMapper } from 'easyhard-bridge'
import { Observable, OperatorFunction } from 'rxjs'

export type ObservableHandler<T> = Observable<ExtractPayload<T, 'response'>>
export type PipeHandler<T> = OperatorFunction<HandlerPayload<T>, ExtractPayload<T, 'response'>>
export type Handler<T> = ObservableHandler<T> | PipeHandler<T>

export type Handlers<T> = {
  [K in keyof T]: Handler<T[K]>
}

export type HandlerPayload<T> = ObjectMapping<ExtractPayload<T, 'request'>, RequestMapper, 0, 2>
export type RequestPayload<T> = ObjectMapping<ExtractPayload<T, 'request'>, RequestMapper, 0, 1>
export type RequestWithPayload<T> = (Omit<Request<T, keyof T>, 'payload'> & { payload: RequestPayload<T[keyof T]> })
export type SocketRequest<T> = RequestWithPayload<T> | UnsubscribeRequest

export type ResponsePayload<T> = ObjectMapping<ExtractPayload<T, 'response'>, ResponseMapper, 0, 1>
export type SocketResponse<T> = (Omit<Response<T, keyof T>, 'payload'> & { payload: ResponsePayload<T[keyof T]> | undefined }) | ErrorResponse<unknown> | CompleteResponse
