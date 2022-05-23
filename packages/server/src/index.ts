import { Attachment, HandlerPayload, Handlers, ResponsePayload } from './types'
import { Http } from './http'
import { requestTransformer, responseTransformer } from './transformers'
import { ExtractPayload, registerObservable, WsConnection } from 'easyhard-bridge'
import { Observable, OperatorFunction, pipe, throwError } from 'rxjs'
import { catchError, map } from 'rxjs/operators'

export function attach<T, R>(actions: Handlers<T, R>, ws: WsConnection, req: R, http: Http): Attachment {
  const keys = Object.keys(actions).map(key => key as keyof T)
  type Request = ExtractPayload<T[keyof T], 'request'>
  type Return = ExtractPayload<T[keyof T], 'response'>

  const registrations = keys.map(key => {
    const stream = actions[key]
    const transformError = catchError<Return, Observable<Return>>(error => throwError(responseTransformer.prop(error, { ws, cookieSetters: http.cookieSetters })))
    const transformParams = map<Request, HandlerPayload<T[keyof T]>>(v => v && requestTransformer.apply(v, { ws, reqListeners: http.reqListeners, bodyListeners: http.bodyListeners }))
    const transformValue = map<Return, ResponsePayload<T[keyof T]>>(v => v && responseTransformer.apply(v, { ws, cookieSetters: http.cookieSetters }))
    const preMap = pipe(transformParams, map(params => ({ ...params, $request: req })))
    const postMap = pipe(transformError, transformValue, map(params => ({ ...params, $request: undefined })))

    if (stream instanceof Observable) {
      const s = stream as Observable<Return>
      return registerObservable(key, s.pipe(postMap), ws)
    } else {
      const s = stream as OperatorFunction<HandlerPayload<T[keyof T]> & { $request: R }, Return>
      return registerObservable(key, pipe(preMap, s, postMap), ws)
    }
  })

  return {
    detach: () => registrations.forEach(remove => remove())
  }
}

export * from './default'
export * from './operators'
export * from './types'
export * from './http'
