import { Observable, OperatorFunction } from 'rxjs'
import { RequestId } from './binder'

export type ExtractPayload<T, K extends 'request' | 'response'> =
  K extends 'response'
    ? (T extends Observable<infer U> ? U : (T extends OperatorFunction<any, infer U> ? U : never))
    : (T extends OperatorFunction<infer U, any> ? U : never)

export type Payload = Record<string, unknown>

export type Request<T, K extends keyof T> = { key: K, id: RequestId, params: ExtractPayload<T[K], 'request'>, subscribe: true }
export type Response<T, K extends keyof T> = { id: RequestId, value: ExtractPayload<T[K], 'response'> }

export class Cookie {
  constructor(public key: string) {}
}

export type RequestMapper = {
  __ob: [Observable<any>, { __ob: string }, Observable<any>],
  __file: [File, { __file: string }, Observable<Buffer>],
  __cookie: [Cookie, { __cookie: string }, Observable<string>],
  __date: [Date, { __date: string }, Date]
}

export type ResponseMapper = {
  __cookie: [Cookie, { __cookie: string }, Cookie],
  __error: [Error, { __error: Record<string, string> }, Error],
  __date: [Date, { __date: string }, Date]
}

export { ObjectMapping, Transformer } from './transformer'
export * from './binder'
