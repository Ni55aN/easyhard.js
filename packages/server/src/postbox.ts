import { ReplaySubject } from 'rxjs'
import { HttpCookies, HttpHeaders, SubjectLike } from './http'
import { Transformer } from './transform'
import { Transformers, TransformHandlerPayload } from './types'

export class Postbox {
  buffers: Map<string, ReplaySubject<Buffer>> = new Map()
  cookies: Map<string, ReplaySubject<string>> = new Map()
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

  acceptHttp = ({ headers, cookies }: { headers: HttpHeaders, cookies: HttpCookies }): SubjectLike<Buffer> | undefined => {
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

      this.cookies.get(cookieId)?.next(cookies[cookieKey])
      this.cookies.get(cookieId)?.complete()
      this.cookies.delete(cookieId)
    }
  }

  acceptWS = <T>(data: T): TransformHandlerPayload<T> => {
    return this.transformer.apply(data)
  }
}
