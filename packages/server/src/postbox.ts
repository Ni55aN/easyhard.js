import { bindObservable, Cookie, RequestMapper, ResponseMapper, Transformer } from 'easyhard-bridge'
import { map } from 'rxjs/operators'
import * as ws from 'ws'
import { BodyListeners, CookieSetters, HttpRequest, ReqListeners, SetCookie } from './http'

export class Postbox {
  requestTransformer = new Transformer<RequestMapper, 1, 2, { ws: ws, reqListeners: ReqListeners, bodyListeners: BodyListeners }>({
    __file: (args, { ws, bodyListeners }) => {
      if (typeof args !== 'object' || !('__file' in args)) return false

      return bindObservable(args.__file, {}, ws, {
        subscribe(id, subscriber) { bodyListeners.set(id, subscriber) },
        unsubscribe(id) { bodyListeners.delete(id) }
      })
    },
    __cookie: (args, { ws, reqListeners }) => {
      if (typeof args !== 'object' || !('__cookie' in args)) return false

      return bindObservable<Record<string, unknown>, HttpRequest>(args.__cookie, {}, ws, {
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
  responseTransformer = new Transformer<ResponseMapper, 0, 1, { ws: ws, cookieSetters: CookieSetters }>({
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
}
