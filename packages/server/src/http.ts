import { Cookie } from 'easyhard-bridge'
import { IncomingMessage, ServerResponse } from 'http'
import { Subject, Subscriber } from 'rxjs'
import { parse, serialize, CookieSerializeOptions } from 'cookie'

export type HttpTunnel = (req: IncomingMessage, res: ServerResponse) => void
export type SubjectLike<T> = Pick<Subject<T>, 'next' | 'error' | 'complete'>
export type HttpHeaders = Record<string, string | string[] | undefined>
export type HttpCookies = Record<string, string | undefined>
export type HttpRequest = { headers: HttpHeaders, cookies: HttpCookies }

export class SetCookie extends Cookie {
  constructor(key: string, public value: string, public options?: CookieSerializeOptions) {
    super(key)
  }
}

export type ReqListeners = Map<string, Subscriber<HttpRequest>>
export type BodyListeners = Map<string, Subscriber<Buffer>>
export type CookieSetters = Map<string, { value: string, options?: CookieSerializeOptions }>

export function useHttp(): {
  bodyListeners: BodyListeners
  reqListeners: ReqListeners
  cookieSetters: CookieSetters
  tunnel: HttpTunnel
} {
  const reqListeners: ReqListeners = new Map()
  const bodyListeners: BodyListeners = new Map()
  const cookieSetters: CookieSetters = new Map()

  function tunnel(req: IncomingMessage, res: ServerResponse) {
    const headers = req.headers as HttpHeaders
    const cookies = parse(req.headers['cookie'] || '')
    const subscriptionId = String(headers['easyhard-subscription-id'])

    const reqListener = reqListeners.get(subscriptionId)
    if (reqListener) {
      reqListener.next({ headers, cookies })
      res.writeHead(200)
      res.end('ok')
      return
    }

    const bodyListener = bodyListeners.get(subscriptionId)
    if (bodyListener) {
      req
        .on('data', data => {
          bodyListener.next(data)
        })
        .on('error', (err) => {
          bodyListener.error(err)
          res.writeHead(400)
          res.end('fail')
        })
        .on('end', () => {
          bodyListener.complete()
          res.writeHead(200)
          res.end('ok')
        })
      return
    }

    const cookieSetterKey = String(headers['easyhard-set-cookie-key'])
    const cookieSetter = cookieSetters.get(cookieSetterKey)

    if (cookieSetter) {
      const cookie = serialize(cookieSetterKey, cookieSetter.value || '', cookieSetter.options)

      res.setHeader('set-cookie', cookie)
      res.writeHead(200)
      res.end('ok')
      return
    }
  }

  return {
    bodyListeners,
    reqListeners,
    cookieSetters,
    tunnel
  }
}
