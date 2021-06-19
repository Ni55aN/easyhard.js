import * as ws from 'ws'
import { useSubscriptions } from './subscriptions'
import { Handlers, SocketRequest, SocketResponse, Transformers } from './types'
import { HttpTunnel, useHttp } from './http'
import { payloadTransformer } from './transform'
import { useConnection } from './connection'

export function easyhardServer<T>(actions: Handlers<T>): { attachClient: (connection: ws) => void , httpTunnel: HttpTunnel } {
  const http = useHttp()
  const transform = payloadTransformer<Transformers>({
    __file: http.trackFile,
    __cookie: http.trackCookie
  })

  function attachClient(ws: ws) {
    const subscriptions = useSubscriptions()
    const connection = useConnection<SocketRequest<T>, SocketResponse<T>>(ws, {
      onMessage(data) {
        const id = data.id

        if ('unsubscribe' in data) {
          subscriptions.remove(id)
        } else if ('action' in data) {
          const handler = actions[data.action]
          const observable = handler(transform(data.payload))
          const subscription = observable.subscribe({
            next(payload) {
              connection.send({ id, payload })
            },
            error<E>(error: E) {
              connection.send({ id, error })
            },
            complete() {
              connection.send({ id, complete: true })
            }
          })

          subscriptions.add(id, subscription)
        } else {
          throw new Error('WS message isn\'t recognized')
        }
      },
      onClose() {
        subscriptions.clear()
      }
    })
  }

  return {
    attachClient,
    httpTunnel: http.tunnel
  }
}

export * from './operators'
