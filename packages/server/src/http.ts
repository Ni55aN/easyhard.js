import { IncomingMessage, ServerResponse } from 'http'
import { Subject } from 'rxjs'
import { parse, serialize, CookieSerializeOptions } from 'cookie'

export type HttpTunnel = (req: http.IncomingMessage, res: http.OutgoingMessage) => void
export type SubjectLike<T> = Pick<Subject<T>, 'next' | 'error' | 'complete'>
export type HttpHeaders = Record<string, string | undefined>
export type HttpCookies = Record<string, string>
type Props = {
  onRequest: (props: {headers: HttpHeaders, cookies: HttpCookies }) => void | SubjectLike<Buffer>
  onError?: (error: Error) => void
}

export function useHttp({ onRequest, onError }: Props): { tunnel: HttpTunnel } {
  function tunnel(req: IncomingMessage, res: ServerResponse) {
    const headers = req.headers as Record<string, string | undefined>
    const cookies = parse(req.headers['cookie'] || '')
    const response = onRequest({ headers, cookies })

    if (response && 'next' in response) {
      req
        .on('data', (data: Buffer) => {
          response.next(data)
        })
        .on('error', (error) => {
          onError && onError(error)
          response.error(error)
          res.writeHead(400)
          res.end('fail')
        })
        .on('end', () => {
          response.complete()
          res.writeHead(200)
          res.end('ok')
        })
    } else {
      res.writeHead(200)
      res.end('ok')
    }
  }

  return {
    tunnel
  }
}
