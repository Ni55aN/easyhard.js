import { Cookie } from 'easyhard-bridge'
import * as ws from 'ws'
import { serializeError } from './utils'

type Props<In> = {
  onMessage: (data: In) => void
  onClose: () => void
}

export function serializeCookie<T extends Record<string, unknown>>(_: string, value: T): T | Record<string, unknown> {
  if (value instanceof Cookie) {
    return { __CookieInstance: true, key: value.key }

  }
  return value
}

export function useConnection<In, Out>(ws: ws, props: Props<In>) {
  ws.on('message', data => {
    const request: In = JSON.parse(data.toString('utf-8'), serializeError)

    props.onMessage(request)
  })

  return {
    send(data: Out) {
      if (ws.readyState === ws.OPEN) {
        ws.send(JSON.stringify(data, (key, value) => serializeCookie(key, serializeError(key, value))))
        return true
      }
    }
  }
}
