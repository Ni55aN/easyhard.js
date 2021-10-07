import { CookieSerializeOptions } from 'cookie'
import { Subscriber } from 'rxjs'
import { Cookie } from 'easyhard-bridge'

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

export type Http = {
  bodyListeners: BodyListeners
  reqListeners: ReqListeners
  cookieSetters: CookieSetters
}
