import {ExtractPayload, ObjectMapping, RequestMapper, ResponseMapper } from 'easyhard-bridge'
import { Observable, OperatorFunction } from 'rxjs'
import { Request } from './http'

export type ObservableHandler<T> = T extends Observable<infer U> ? Observable<U> : never
export type PipeHandler<T> = T extends OperatorFunction<infer A, infer B> ? OperatorFunction<ObjectMapping<A, RequestMapper, 0, 2> & { $request: Request }, B> : never
export type Handler<T> = ObservableHandler<T> | PipeHandler<T>

export type Handlers<T> = {
  [K in keyof T]: Handler<T[K]>
}

export type HandlerPayload<T> = ObjectMapping<ExtractPayload<T, 'request'>, RequestMapper, 0, 2>
export type ResponsePayload<T> = ObjectMapping<ExtractPayload<T, 'response'>, ResponseMapper, 0, 1>
