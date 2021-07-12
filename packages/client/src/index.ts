import { bindObservable, Cookie, ExtractPayload, ObjectMapping, registerObservable, ResponseMapper } from 'easyhard-bridge'
import { defer, NEVER, Observable, of, throwError } from 'rxjs'
import { catchError, finalize, map, tap } from 'rxjs/operators'
import { createConnection } from './connection'
import { useHttp } from './http'
import { requestTransformer, responseTransformer } from './transformers'
import { ConnectionArgs, JSONPayload } from './types'

type Props = {
  reconnectDelay?: number;
  onConnect?: () => void;
  onError?: (error: Error) => void;
  onClose?: (event: CloseEvent) => void;
}

/* eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types */
export function easyhardClient<T>({
  reconnectDelay = 5000
}: Props = {}) {
  const http = useHttp(() => connection.args?.http)
  const connection = createConnection<ConnectionArgs>({
    reconnectDelay
  })

  function call<K extends keyof T>(...args: ExtractPayload<T[K], 'request'> extends undefined ? [K] : [K, ExtractPayload<T[K], 'request'>]) {
    type Params = ExtractPayload<T[K], 'request'>
    type Return = ExtractPayload<T[K], 'response'>
    const key = args[0]
    const params = args[1] || {} as Params

    const transformError = catchError<Return, Observable<Return>>(err => throwError(responseTransformer.prop(err, null)))
    const transformValue = map<Return, ObjectMapping<Return, ResponseMapper, 1, 2>>(value => responseTransformer.apply(value, null))

    const jsonParams = requestTransformer.apply(params, null)

    const paramObservables = requestTransformer.diffs(params as any, jsonParams).map(item => {
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
    return bindObservable<JSONPayload<T[K]>, Return>(key, jsonParams, connection).pipe(
      transformError,
      transformValue,
      tap(value => {
        Object.values(value).forEach(item => {
          // TODO
          if (item instanceof Cookie) http.send(item.key, { 'easyhard-set-cookie-key': item.key })
        })
      }),
      finalize(() => {
        paramObservables.forEach(destroy => destroy && destroy())
      })
    )
  }

  return {
    connect: connection.connect,
    close,
    call,
    state: defer(() => of(connection.readyState))
  }
}
