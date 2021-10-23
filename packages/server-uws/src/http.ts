import { HttpResponse, HttpRequest } from 'uWebSockets.js'
import { BodyListeners, CookieSetters, Http, HttpHeaders, ReqListeners } from 'easyhard-server'
import { parse, serialize } from 'cookie'
import { arrayBufferToBuffer } from './utils'

export type HttpTunnel = (res: HttpResponse, req: HttpRequest) => void

export function useHttp(): Http & { tunnel: HttpTunnel } {
    const reqListeners: ReqListeners = new Map()
    const bodyListeners: BodyListeners = new Map()
    const cookieSetters: CookieSetters = new Map()

    function tunnel(res: HttpResponse, req: HttpRequest) {
        const headers: HttpHeaders = {}
        req.forEach((key, value) => headers[key] = value)

        const cookies = parse(headers['cookie'] as string || '')
        const subscriptionId = String(headers['easyhard-subscription-id'])

        const reqListener = reqListeners.get(subscriptionId)
        if (reqListener) {
            reqListener.next({ headers, cookies })
            res.writeStatus('200 OK')
            res.end('ok')
            return
        }

        const bodyListener = bodyListeners.get(subscriptionId)
        if (bodyListener) {
            res.onData((data, isLast) => {
                bodyListener.next(arrayBufferToBuffer(data))
                if (isLast) {
                    bodyListener.complete()
                    res.writeStatus('200 OK')
                    res.end('ok')
                }
            }).onAborted(() => {
                bodyListener.error('Unknown error')
                res.writeStatus('400 OK')
                res.end('fail')
            })
            return
        }

        const cookieSetterKey = String(headers['easyhard-set-cookie-key'])
        const cookieSetter = cookieSetters.get(cookieSetterKey)

        if (cookieSetter) {
            const cookie = serialize(cookieSetterKey, cookieSetter.value || '', cookieSetter.options)

            res.setHeader('set-cookie', cookie)
            res.writeStatus('200 OK')
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
