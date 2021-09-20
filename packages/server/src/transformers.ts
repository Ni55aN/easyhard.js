import { bindObservable, Cookie, RequestMapper, ResponseMapper, Transformer, WsConnection } from 'easyhard-bridge'
import { map } from 'rxjs/operators'
import { BodyListeners, CookieSetters, HttpRequest, ReqListeners, SetCookie } from './http'

export const requestTransformer = new Transformer<RequestMapper, 1, 2, { ws: WsConnection, reqListeners: ReqListeners, bodyListeners: BodyListeners }>({
  __ob: (args, { ws }) => {
    if (typeof args !== 'object' || !('__ob' in args)) return false

    return bindObservable(args.__ob, null, ws)
  },
  __file: (args, { ws, bodyListeners }) => {
    if (typeof args !== 'object' || !('__file' in args)) return false

    return bindObservable(args.__file, null, ws, {
      subscribe(id, subscriber) { bodyListeners.set(id, subscriber) },
      unsubscribe(id) { bodyListeners.delete(id) }
    })
  },
  __cookie: (args, { ws, reqListeners }) => {
    if (typeof args !== 'object' || !('__cookie' in args)) return false

    return bindObservable<HttpRequest>(args.__cookie, null, ws, {
      subscribe(id, subscriber) { reqListeners.set(id, subscriber) },
      unsubscribe(id) { reqListeners.delete(id) }
    }).pipe(map(args => {
      const key = String(args.headers['easyhard-cookie-key'])
      return key && args.cookies[key] || ''
    }))
  },
  __date: args => {
    if (typeof args !== 'object' || !('__date' in args)) return false

    return new Date(args.__date)
  }
})
export const responseTransformer = new Transformer<ResponseMapper, 0, 1, { ws: WsConnection, cookieSetters: CookieSetters }>({
  __cookie: (arg, { cookieSetters }) => {
    if (arg instanceof Cookie) {
      arg instanceof SetCookie && cookieSetters.set(arg.key, { value: arg.value, options: arg.options })

      return { __cookie: arg.key }
    }
    return false
  },
  __error: arg => {
    if (arg instanceof Error) {
      const error: Record<string, string> = {}
      Object.getOwnPropertyNames(arg).forEach(key => {
        error[key] = (arg as unknown as Record<string, string>)[key]
      })
      return { __error: error }
    }
    return false
  },
  __date: arg => arg instanceof Date && { __date: arg.toISOString() }
})
