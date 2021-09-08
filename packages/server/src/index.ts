import * as ws from 'ws'
import { HandlerPayload, Handlers, ObservableHandler, PipeHandler, ResponsePayload } from './types'
import { HttpTunnel, Request, useHttp } from './http'
import { requestTransformer, responseTransformer } from './transformers'
import { ExtractPayload, registerObservable } from 'easyhard-bridge'
import { Observable, pipe, throwError } from 'rxjs'
import { catchError, map } from 'rxjs/operators'

export function easyhardServer<T>(actions: Handlers<T>): { attachClient: (connection: ws, request: Request) => void , httpTunnel: HttpTunnel } {
  const http = useHttp()
  const keys = Object.keys(actions).map(key => key as keyof T)

  function attachClient(ws: ws, req: Request) {
    type Request = ExtractPayload<T[keyof T], 'request'>
    type Return = ExtractPayload<T[keyof T], 'response'>

    keys.forEach(key => {
      const stream = actions[key]
      const transformError = catchError<Return, Observable<Return>>(error => throwError(responseTransformer.prop(error, { ws, cookieSetters: http.cookieSetters })))
      const transformParams = map<Request, HandlerPayload<T[keyof T]>>(v => v && requestTransformer.apply(v, { ws, reqListeners: http.reqListeners, bodyListeners: http.bodyListeners }))
      const transformValue = map<Return, ResponsePayload<T[keyof T]>>(v => v && responseTransformer.apply(v, { ws, cookieSetters: http.cookieSetters }))
      const preMap = pipe(transformParams, map(params => ({ ...params, $request: req })))
      const postMap = pipe(transformError, transformValue)

      if (stream instanceof Observable) {
        const s = stream as ObservableHandler<T[keyof T]>
        registerObservable(key, s.pipe(postMap as any), ws)
      } else {
        const s =  stream as PipeHandler<T[keyof T]>
        registerObservable(key, pipe(preMap, s as any, postMap), ws)
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
