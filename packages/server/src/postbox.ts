import { getUID } from 'easyhard-common'
import { ReplaySubject } from 'rxjs'
import { HttpCookies, HttpHeaders, SetCookie, SubjectLike } from './http'
import { Transformer } from './transform'
import { Transformers, TransformHandlerPayload } from './types'

export class Postbox {
  buffers: Map<string, ReplaySubject<Buffer>> = new Map()
  cookies: Map<string, ReplaySubject<string>> = new Map()
  setCookies: Map<string, SetCookie[]> = new Map()
  transformer: Transformer<Transformers>

  constructor() {
    this.transformer = new Transformer<Transformers>({
      __file: id => {
        const subject = new ReplaySubject<Buffer>()

        this.buffers.set(id, subject)
        return subject
      },
      __cookie: id => {
        const subject = new ReplaySubject<string>(1)

        this.cookies.set(id, subject)
        return subject
      }
    })
  }

  acceptWSResponse<T>(sourcePayload: T): { payload: T, cookie?: string } {
    const payload = { ...sourcePayload } as Record<string, unknown>
    const entries = Object.keys(payload).map(key => [key, payload[key]]).filter((args): args is [string, SetCookie] => args[1] instanceof SetCookie)
    const cookies = entries.map(args => args[1])

    if (entries.length > 0) {
      const id = getUID()
      this.setCookies.set(id, cookies)
      return {
        cookie: id,
        payload: payload as T
      }
    } else {
      return {
        payload: payload as T
      }
    }
  }

  acceptHttp = ({ headers, cookies }: { headers: HttpHeaders, cookies: HttpCookies }): SubjectLike<Buffer> | { cookies?: SetCookie[] } | undefined => {
    if (headers['file-id']) {
      const fileId = headers['file-id']
      const { buffers } = this

      return {
        next: value => {
          buffers.get(fileId)?.next(value)
        },
        error: error => {
          buffers.get(fileId)?.error(error)
          buffers.delete(fileId)
        },
        complete: () => {
          buffers.get(fileId)?.complete()
          buffers.delete(fileId)
        }
      }
    }

    if (headers['cookie-id'] && headers['cookie-key']) {
      const cookieId = headers['cookie-id']
      const cookieKey = headers['cookie-key']

      this.cookies.get(cookieId)?.next(cookies[cookieKey] || '')
      this.cookies.get(cookieId)?.complete()
      this.cookies.delete(cookieId)
    }

    if (headers['easyhard-set-cookie']) {
      const cookieId = headers['easyhard-set-cookie']
      const cookies = this.setCookies.get(cookieId)

      this.setCookies.delete(cookieId)
      if (cookies) {
        return {
          cookies
        }
      }
    }
  }

  acceptWSRequest = <T>(data: T): TransformHandlerPayload<T> => {
    return this.transformer.apply(data)
  }
}
