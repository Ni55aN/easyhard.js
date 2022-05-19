
import { IncomingMessage, ServerResponse } from 'http'
import { parse, serialize } from 'cookie'
import { BodyListeners, CookieSetters, Http, HttpHeaders, ReqListeners } from '../http'

export type HttpTunnel = (req: IncomingMessage, res: ServerResponse) => void
export type Request = IncomingMessage

export function useHttp(): Http & { tunnel: HttpTunnel } {
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
        .on('data', (data: Buffer) => {
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
