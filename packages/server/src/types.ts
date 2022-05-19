import {ExtractPayload, ObjectMapping, RequestMapper, ResponseMapper } from 'easyhard-bridge'
import { Observable, OperatorFunction } from 'rxjs'

export type ObservableHandler<T> = T extends Observable<infer U> ? Observable<U> : never
export type PipeHandler<T, R> = T extends OperatorFunction<infer A, infer B> ? OperatorFunction<ObjectMapping<A, RequestMapper, 1, 2> & { $request: R }, B> : never
export type Handler<T, R> = ObservableHandler<T> | PipeHandler<T, R>

export type Handlers<T, R> = {
  [K in keyof T]: Handler<T[K], R>
}

export type HandlerPayload<T> = ObjectMapping<ExtractPayload<T, 'request'>, RequestMapper, 1, 2>
export type ResponsePayload<T> = ObjectMapping<ExtractPayload<T, 'response'>, ResponseMapper, 0, 1>

export type Attachment = { detach: () => void }
