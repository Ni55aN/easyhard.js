import { IncomingMessage, ServerResponse } from 'http'
import { Subject } from 'rxjs'
import { parse, serialize, CookieSerializeOptions } from 'cookie'
import { Cookie } from 'easyhard-common'

export type HttpTunnel = (req: IncomingMessage, res: ServerResponse) => void
export type SubjectLike<T> = Pick<Subject<T>, 'next' | 'error' | 'complete'>
export type HttpHeaders = Record<string, string | undefined>
export type HttpCookies = Record<string, string | undefined>

export class SetCookie extends Cookie {
  constructor(key: string, public value: string, public options?: CookieSerializeOptions) {
    super(key)
  }
}

type Props = {
  onRequest: (props: {headers: HttpHeaders, cookies: HttpCookies }) => void | SubjectLike<Buffer> | { cookies?: SetCookie[] },
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
    } else if (response && response.cookies) {
      const cookies = response.cookies.map(cookie => serialize(cookie.key, cookie.value || '', cookie.options))

      res.setHeader('set-cookie', cookies)
      res.writeHead(200)
      res.end('ok')
    } else {
      res.writeHead(200)
      res.end('ok')
    }
  }

  return {
    tunnel
  }
}
