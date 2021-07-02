import { Cookie, ObjectMapping, RequestMapper, ResponseMapper, Transformer } from 'easyhard-bridge'
import { getUID } from 'easyhard-common'
import { Observable, ReplaySubject, Subject } from 'rxjs'
import { HttpCookies, HttpHeaders, SetCookie, SubjectLike } from './http'
import { HandlerPayload, RequestPayload } from './types'

export class Postbox {
  private buffers: Map<string, ReplaySubject<Buffer>> = new Map()
  private cookies: Map<string, ReplaySubject<string>> = new Map()
  subjects: Map<string, Subject<unknown>> = new Map()
  private setCookies: Map<string, SetCookie[]> = new Map()
  requestTransformer = new Transformer<RequestMapper, 1, 2>({
    __file: args => {
      if (typeof args !== 'object' || !('__file' in args)) return false
      const subject = new ReplaySubject<Buffer>()

      this.buffers.set(args.__file, subject)
      return subject
    },
    __cookie: args => {
      if (typeof args !== 'object' || !('__cookie' in args)) return false
      const subject = new ReplaySubject<string>(1)

      this.cookies.set(args.__cookie, subject)
      return subject
    },
    __date: args => {
      if (typeof args !== 'object' || !('__date' in args)) return false

      return new Date(args.__date)
    },
    __observable: args => {
      if (typeof args !== 'object' || !('__observable' in args)) return false
      const subject = new Subject()

      this.subjects.set(args.__observable, subject)
      return subject
    }
  })
  private responseTransformer = new Transformer<ResponseMapper, 0, 1>({
    __cookie: arg => arg instanceof Cookie && { __cookie: arg.key },
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

  acceptWSResponse<T>(payload: T): { payload: ObjectMapping<T, ResponseMapper, 0, 1> | undefined, cookie?: string } {
    const payloadObj = { ...payload } as Record<string, unknown>
    const entries = Object.keys(payload).map(key => [key, payloadObj[key]]).filter((args): args is [string, SetCookie] => args[1] instanceof SetCookie)
    const cookies = entries.map(args => args[1])
    const jsonPayload = this.responseTransformer.apply(payload)

    if (entries.length > 0) {
      const id = getUID()
      this.setCookies.set(id, cookies)
      return {
        cookie: id,
        payload: jsonPayload
      }
    } else {
      return {
        payload: jsonPayload
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

  acceptWSRequest = <T, K extends keyof T>(data: RequestPayload<T[K]>, events: { onSubscribe: (id: string) => void }): HandlerPayload<T[K]> => {
    const result = this.requestTransformer.apply(data, ({ from, to }) => {
      if ('__observable' in from && to instanceof Subject) return new Observable(subscriber => {
        events.onSubscribe(from.__observable)
        return to.subscribe(subscriber)
      })
      return to
    }) as HandlerPayload<T[K]>

    return result
  }

  acceptError<E>(error: E): ReturnType<Transformer<ResponseMapper, 1, 2>['prop']> {
    return this.responseTransformer.prop(error)
  }
}
