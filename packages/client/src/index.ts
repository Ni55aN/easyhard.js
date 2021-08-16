import { bindObservable, Cookie, ObjectMapping, registerObservable, ResponseMapper } from 'easyhard-bridge'
import { getUID } from 'easyhard-common'
import { NEVER, Observable, OperatorFunction, throwError } from 'rxjs'
import { catchError, map, tap } from 'rxjs/operators'
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

  function call<K extends keyof T>(key: K): T[K] extends Observable<infer U> ? Observable<U> : never {
    type Type = T[K] extends Observable<infer U> ? U : (T[K] extends OperatorFunction<unknown, infer B> ? B : never)
    type ObType = T[K] extends Observable<infer U> ? Observable<U> : never
    type JSONResponse = ObjectMapping<Type, ResponseMapper, 0, 1>

    const transformError = catchError<JSONResponse, Observable<JSONResponse>>(err => throwError(responseTransformer.prop(err, null)))
    const transformValue = map<JSONResponse, Type>(value => value && responseTransformer.apply(value, null) as Type)

    return bindObservable<JSONResponse>(key, null, connection).pipe(
      transformError,
      transformValue,
      tap(value => {
        Object.values(value as Record<string, unknown>).forEach(item => {
          if (item instanceof Cookie) http.send(item.key, { 'easyhard-set-cookie-key': item.key })
        })
      })
    ) as unknown as ObType
  }

  function pipe<K extends keyof T>(key: K): T[K] extends OperatorFunction<infer A, infer B> ? OperatorFunction<A, B> : OperatorFunction<any, any> {
    type Input = T[K] extends OperatorFunction<infer U, any> ? U : never
    type Output = T[K] extends OperatorFunction<any, infer U> ? U : never
    type JSONResponse = ObjectMapping<Output, ResponseMapper, 0, 1>

    const transformError = catchError<JSONResponse, Observable<JSONResponse>>(err => throwError(responseTransformer.prop(err, null)))
    const transformValue = map<JSONResponse, Output>(value => value && responseTransformer.apply(value, null) as Output)

    return ((source: Observable<Input>) => {
      const sourceId = getUID()
      const paramsDestroy: ((() => void) | undefined)[] = []
      const jsonSource = source.pipe(
        map(params => {
          const jsonParams = (params ? requestTransformer.apply(params, null) : {}) as JSONPayload<Input>
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
          paramsDestroy.push(...mountParams())
          return jsonParams
        })
      )

      return bindObservable<JSONResponse>(key, sourceId, connection).pipe(
        transformError,
        transformValue,
        tap(value => {
          Object.values(value as Record<string, unknown>).forEach(item => {
            if (item instanceof Cookie) http.send(item.key, { 'easyhard-set-cookie-key': item.key })
          })
        }),
        mount(() => {
          const destroy = registerObservable(sourceId, jsonSource, connection)

          return () => {
            destroy()
            while(paramsDestroy.length) (paramsDestroy.shift() || (() => null))()
          }
        })
      )
    }) as any
  }

  return {
    connect: connection.connect,
    close: connection.close,
    call,
    pipe,
    state: connection.state
  }
}
