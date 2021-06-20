import http from 'http'
import { Subject } from 'rxjs'
import { parse, serialize, CookieSerializeOptions } from 'cookie'

export type HttpTunnel = (req: http.IncomingMessage, res: http.OutgoingMessage) => void
export type SubjectLike<T> = Pick<Subject<T>, 'next' | 'error' | 'complete'>
export type HttpHeaders = Record<string, string | undefined>
export type HttpCookies = Record<string, string>
type Props = {
  onRequest: (props: {headers: HttpHeaders, cookies: HttpCookies }) => void | SubjectLike<Buffer>,
  onError?: (error: Error) => void
}

export function useHttp({ onRequest, onError }: Props): { tunnel: HttpTunnel } {
  function tunnel(req: http.IncomingMessage, res: http.OutgoingMessage) {
    const headers = req.headers as Record<string, string | undefined>
    const cookies = parse(req.headers['cookie'] || '')
    const body = onRequest({ headers, cookies })

    if (body) {
      req
        .on('data', (data: Buffer) => {
          body.next(data)
        })
        .on('error', (error) => {
          onError && onError(error)
          body.error(error)
          res.end('fail')
        })
        .on('end', () => {
          body.complete()
          res.end('ok')
        })
    } else {
      res.end('ok')
    }
  }

  return {
    tunnel
  }
}
