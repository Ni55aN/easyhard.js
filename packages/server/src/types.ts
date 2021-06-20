import { CompleteResponse, Cookie, ErrorResponse, Request, Response, ExtractPayload, UnsubscribeRequest, FindNonNullableField } from 'easyhard-common'
import { Observable } from 'rxjs'

export type Transformers = {
  __file: [File, string, Observable<Buffer>],
  __cookie: [Cookie, string, Observable<string>]
}

export type TransformHandlerPayload<T> = { [K in keyof T]: FindNonNullableField<{
  [KK in keyof Transformers]: T[K] extends Transformers[KK][0] ? Transformers[KK][2] : undefined
}> }

export type Handler<T> = (
 payload: TransformHandlerPayload<ExtractPayload<T, 'request'>>
) => Observable<ExtractPayload<T, 'response'>>

export type Handlers<T> = {
  [K in keyof T]: Handler<T[K]>
}

export type SocketRequest<T> = Request<T, keyof T> | UnsubscribeRequest
export type SocketResponse<T> = Response<T, keyof T> | ErrorResponse<unknown> | CompleteResponse
