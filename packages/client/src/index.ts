import { bindObservable, Cookie, ExtractPayload, ObjectMapping, registerObservable, ResponseMapper } from 'easyhard-bridge'
import { defer, NEVER, Observable, of, OperatorFunction, throwError } from 'rxjs'
import { catchError, map, mergeMap, tap } from 'rxjs/operators'
import { createConnection } from './connection'
import { useHttp } from './http'
import { requestTransformer, responseTransformer } from './transformers'
import { ConnectionArgs, JSONPayload } from './types'
import { mount } from './utils'

type Props = {
  reconnectDelay?: number
}

/* eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types */
export function easyhardClient<T>({
  reconnectDelay = 5000
}: Props = {}) {
  const http = useHttp(() => connection.args?.http)
  const connection = createConnection<ConnectionArgs>({
    reconnectDelay
  })

  function apply<K extends keyof T>(key: K, params?: ExtractPayload<T[K], 'request'>) {
    type Type = T[K] extends Observable<infer U> ? U : (T[K] extends OperatorFunction<unknown, infer B> ? B : never)
    type ObType = T[K] extends Observable<infer U> ? Observable<U> : never
    type JSONResponse = ObjectMapping<Type, ResponseMapper, 0, 1>

    const transformError = catchError<JSONResponse, Observable<Type>>(err => throwError(responseTransformer.prop(err, null)))
    const transformValue = map<JSONResponse, Type>(value => responseTransformer.apply(value, null) as Type)

    const jsonParams = (params ? requestTransformer.apply(params, null) : {}) as JSONPayload<Type>
    const paramsDiffs = requestTransformer.diffs(params as any, jsonParams || {})
    const mountParams = () => paramsDiffs.map(item => {
      if (item.from instanceof Observable && '__ob' in item.to) {
        const observable = item.from
        const key = item.to.__ob

        return registerObservable(key, observable, connection)
      }
      if (item.from instanceof File && '__file' in item.to) {
        const file = item.from
        const key = item.to.__file

        return registerObservable(key, NEVER, connection, {
          subscribe(id) { http.send(id, { 'easyhard-subscription-id': id }, file) },
          unsubscribe(id) { http.abort(id) }
        })
      }
      if (item.from instanceof Cookie && '__cookie' in item.to) {
        const cookie = item.from
        const key = item.to.__cookie

        return registerObservable(key, NEVER, connection, {
          subscribe(id) { http.send(id, { 'easyhard-subscription-id': id, 'easyhard-cookie-key': cookie.key }) },
          unsubscribe(id) { http.abort(id) }
        })
      }
    })

    return bindObservable<JSONPayload<Type>, Type>(key, jsonParams, connection).pipe(
      transformError as any,
      transformValue,
      tap(value => {
        Object.values(value as Record<string, unknown>).forEach(item => {
          if (item instanceof Cookie) http.send(item.key, { 'easyhard-set-cookie-key': item.key })
        })
      }),
      mount(() => {
        const paramObservables = mountParams()
        return () => paramObservables.forEach(destroy => destroy && destroy())
      })
    ) as unknown as ObType
  }

  function call<K extends keyof T>(key: K): T[K] extends Observable<infer U> ? Observable<U> : never {
    return apply(key)
  }

  function pipe<K extends keyof T>(key: K): T[K] extends OperatorFunction<infer A, infer B> ? OperatorFunction<A, B> : never {
    return mergeMap(params => apply(key, params as any)) as any
  }

  return {
    connect: connection.connect,
    call,
    pipe,
    state: defer(() => of(connection.readyState))
  }
}
