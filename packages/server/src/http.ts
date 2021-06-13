import http from 'http'
import { ReplaySubject } from 'rxjs'

export type HttpTunnel = (req: http.IncomingMessage, res: http.OutgoingMessage) => void

export function useHttp(): { track: (id: string) => ReplaySubject<Buffer>, tunnel: HttpTunnel } {
  const buffers: Map<string, ReplaySubject<Buffer>> = new Map()

  function tunnel(req: http.IncomingMessage, res: http.OutgoingMessage) {
    const fileId = req.headers['file-id'] as string

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
  }

  return {
    track(id) {
      const subject = new ReplaySubject<Buffer>()

      buffers.set(id, subject)
      return subject
    },
    tunnel
  }
}
