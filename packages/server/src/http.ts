import http from 'http'
import { ReplaySubject } from 'rxjs'
import { parseCookies } from './utils'

export type HttpTunnel = (req: http.IncomingMessage, res: http.OutgoingMessage) => void

export function useHttp(): { trackFile: (id: string) => ReplaySubject<Buffer>, trackCookie: (id: string) => ReplaySubject<string>, tunnel: HttpTunnel } {
  const buffers: Map<string, ReplaySubject<Buffer>> = new Map()
  const cookies: Map<string, ReplaySubject<string>> = new Map()

  function tunnel(req: http.IncomingMessage, res: http.OutgoingMessage) {
    const fileId = req.headers['file-id'] as string

    if (fileId) {
      req
        .on('data', (data: Buffer) => {
          const subject = buffers.get(fileId)

          if (subject) {
            subject.next(data)
          } else {
            console.error('data: subject not found')
          }
        })
        .on('error', error => {
          const subject = buffers.get(fileId)

          console.error(error)
          if (subject) {
            subject.error(error)
            buffers.delete(fileId)
          } else {
            console.error('data: subject not found')
          }
        })
        .on('end', function() {
          const subject = buffers.get(fileId)

          if (subject) {
            subject.complete()
            buffers.delete(fileId)
          } else {
            console.error('end: subject not found')
          }
          res.end('ok')
        })
      return
    }

    const cookieId = req.headers['cookie-id'] as string
    const cookieKey = req.headers['cookie-key'] as string

    if (cookieId && cookieKey) {
      const requestCookies = parseCookies(req.headers['cookie'] || '')

      cookies.get(cookieId)?.next(requestCookies[cookieKey])
      res.end('ok')
      return
    }

    res.end('fail')
  }

  return {
    trackFile(id) {
      const subject = new ReplaySubject<Buffer>()

      buffers.set(id, subject)
      return subject
    },
    trackCookie(id) {
      const subject = new ReplaySubject<string>(1)

      cookies.set(id, subject)
      return subject
    },
    tunnel
  }
}
