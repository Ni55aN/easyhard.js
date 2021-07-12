import * as ws from 'ws'
import { HandlerPayload, Handlers, PipeHandler, ResponsePayload } from './types'
import { HttpTunnel, useHttp } from './http'
import { Postbox } from './postbox'
import { ExtractPayload, registerObservable } from 'easyhard-bridge'
import { Observable, pipe, throwError } from 'rxjs'
import { catchError, map } from 'rxjs/operators'

export function easyhardServer<T>(actions: Handlers<T>): { attachClient: (connection: ws) => void , httpTunnel: HttpTunnel } {
  const postbox = new Postbox()
  const http = useHttp()
  const keys = Object.keys(actions).map(key => key as keyof T)

  function attachClient(ws: ws) {
    type Request = ExtractPayload<T[keyof T], 'request'>
    type Return = ExtractPayload<T[keyof T], 'response'>

    keys.forEach(key => {
      const stream = actions[key]
      const transformError = catchError<Return, Observable<Return>>(error => throwError(postbox.responseTransformer.prop(error, { ws, cookieSetters: http.cookieSetters })))
      const transformParams = map<Request, HandlerPayload<T[keyof T]>>(v => postbox.requestTransformer.apply(v, { ws, reqListeners: http.reqListeners, bodyListeners: http.bodyListeners }))
      const transformValue = map<Return, ResponsePayload<T[keyof T]>>(v => postbox.responseTransformer.apply(v, { ws, cookieSetters: http.cookieSetters }))
      const preMap = pipe(transformParams)
      const postMap = pipe(transformError, transformValue)

      if (stream instanceof Observable) {
        registerObservable(key, stream.pipe(postMap), ws)
      } else {
        registerObservable(key, pipe(preMap, stream as PipeHandler<T[keyof T]>, postMap), ws)
      }
    })
  }

  return {
    attachClient,
    httpTunnel: http.tunnel
  }
}

export * from './operators'
export { SetCookie } from './http'
