import {ExtractPayload, ObjectMapping, RequestMapper, ResponseMapper } from 'easyhard-bridge'
import { Observable, OperatorFunction } from 'rxjs'

export type ObservableHandler<T> = Observable<ExtractPayload<T, 'response'>>
export type PipeHandler<T> = OperatorFunction<HandlerPayload<T>, ExtractPayload<T, 'response'>>
export type Handler<T> = ObservableHandler<T> | PipeHandler<T>

export type Handlers<T> = {
  [K in keyof T]: Handler<T[K]>
}

export type HandlerPayload<T> = ObjectMapping<ExtractPayload<T, 'request'>, RequestMapper, 0, 2>
export type ResponsePayload<T> = ObjectMapping<ExtractPayload<T, 'response'>, ResponseMapper, 0, 1>
