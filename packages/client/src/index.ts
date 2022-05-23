import { bindObservable, Cookie, ObjectMapping, registerObservable, ResponseMapper } from 'easyhard-bridge'
import { getUID } from 'easyhard-common'
import { NEVER, Observable, OperatorFunction, throwError } from 'rxjs'
import { catchError, map, mergeMap } from 'rxjs/operators'
import { createConnection } from './connection'
import { useHttp } from './http'
import { requestTransformer, responseTransformer } from './transformers'
import { ConnectionArgs, JSONPayload } from './types'
import { mapWithSubscriber, mount } from './utils'

export { Connection }  from './connection'

type Props = {
  reconnectDelay?: number
}

type GetNullKeys<T> = {
  [K in keyof T]: T[K] extends null ? K : never;
}[keyof T];

export function easyhardClient<T>({
  reconnectDelay = 5000
}: Props = {}) {
  const http = useHttp(() => connection.args?.http)
  const connection = createConnection<ConnectionArgs>({
    reconnectDelay
  })

  async function setCookies<T>(value: T) {
    const cookies = Object.values(value as Record<string, unknown> || {}).filter((item): item is Cookie => item instanceof Cookie)

    await Promise.all(cookies.map(item => http.send(item.key, { 'easyhard-set-cookie-key': item.key })))
    return value
  }

  /* eslint-disable @typescript-eslint/no-explicit-any */
  type Calls = Omit<T, GetNullKeys<{
    [K in keyof T]: T[K] extends Observable<any> ? K : null
  }>>

  type GetType<T> = T extends Observable<infer U> ? U : never
  /* eslint-enable @typescript-eslint/no-explicit-any */

  function call<K extends keyof Calls, O extends Calls[K], Type extends GetType<O>>(key: K): Observable<Type> {
    type JSONResponse = ObjectMapping<Type, ResponseMapper, 0, 1>

    const transformError = catchError<JSONResponse, Observable<JSONResponse>>(err => throwError(responseTransformer.prop(err, null)))
    const transformValue = map<JSONResponse, Type>(value => value && responseTransformer.apply(value, null) as Type)

    return bindObservable<JSONResponse>(key, null, connection).pipe(
      transformError,
      transformValue,
      mergeMap(setCookies)
    )
  }

  /* eslint-disable @typescript-eslint/no-explicit-any */
  type Pipes = Omit<T, GetNullKeys<{
    [K in keyof T]: T[K] extends OperatorFunction<any, any> ? K : null
  }>>

  type GetInput<T> = T extends OperatorFunction<infer U, any> ? U : never
  type GetOutput<T> = T extends OperatorFunction<any, infer U> ? U : never
  /* eslint-enable @typescript-eslint/no-explicit-any */

  function pipe<K extends keyof Pipes, P extends Pipes[K], Input extends GetInput<P>, Output extends GetOutput<P>>(key: K): OperatorFunction<Input, Output> {
    type JSONResponse = ObjectMapping<Output, ResponseMapper, 0, 1>

    const transformError = catchError<JSONResponse, Observable<JSONResponse>>(err => throwError(responseTransformer.prop(err, null)))
    const transformValue = map<JSONResponse, Output>(value => value && responseTransformer.apply(value, null) as Output)

    return ((source: Observable<Input>) => {
      const sourceId = getUID()
      const paramsDestroy: ((() => void) | undefined)[] = []
      const jsonSource = source.pipe(
        mapWithSubscriber((params, subscriber) => {
          const jsonParams = (params ? requestTransformer.apply(params, null) : {}) as JSONPayload<Input>
          const paramsDiffs = requestTransformer.diffs(params as Record<string, unknown>, jsonParams || {})

          paramsDestroy.push(...paramsDiffs.map(item => {
            if (item.from instanceof Observable && '__ob' in item.to) {
              const observable = item.from
              const key = item.to.__ob

              return registerObservable(key, observable, connection)
            }
            if (item.from instanceof File && '__file' in item.to) {
              const file = item.from
              const key = item.to.__file

              return registerObservable(key, NEVER, connection, {
                subscribe(id) {
                  http
                    .send(id, { 'easyhard-subscription-id': id }, file)
                    .catch(e => subscriber.error(e.message || e))
                },
                unsubscribe(id) {
                  http.abort(id)
                }
              })
            }
            if (item.from instanceof Cookie && '__cookie' in item.to) {
              const cookie = item.from
              const key = item.to.__cookie

              return registerObservable(key, NEVER, connection, {
                subscribe(id) {
                  http
                    .send(id, { 'easyhard-subscription-id': id, 'easyhard-cookie-key': cookie.key })
                    .catch(e => subscriber.error(e.message || e))
                },
                unsubscribe(id) {
                  http.abort(id)
                }
              })
            }
          }))

          return jsonParams
        })
      )

      return bindObservable<JSONResponse>(key, sourceId, connection).pipe(
        transformError,
        transformValue,
        mergeMap(setCookies),
        mount(() => {
          const destroy = registerObservable(sourceId, jsonSource, connection)

          return () => {
            destroy()
            while(paramsDestroy.length) (paramsDestroy.shift() || (() => null))()
          }
        })
      )
    })
  }

  return {
    connect: connection.connect,
    close: connection.close,
    call,
    pipe,
    state: connection.state
  }
}
