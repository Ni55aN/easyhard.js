import * as ws from 'ws'
import { useSubscriptions } from './subscriptions'
import { Handlers, SocketRequest, SocketResponse } from './types'
import { HttpTunnel, useHttp } from './http'
import { useConnection } from './connection'
import { Postbox } from './postbox'

type Props = {
  onError: (error: Error) => void
}

export function easyhardServer<T>(actions: Handlers<T>, props?: Props): { attachClient: (connection: ws) => void , httpTunnel: HttpTunnel } {
  const postbox = new Postbox()
  const http = useHttp({
    onRequest: postbox.acceptHttp,
    onError: props?.onError
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
          const params = postbox.acceptWSRequest(data.payload, {
            onSubscribe(observableId) {
              connection.send({ id, observable: observableId, subscribe: true })
            }
          })
          const observable = handler(params)
          const subscription = observable.subscribe({
            next(payload) {
              const args = postbox.acceptWSResponse(payload)
              connection.send({ id, ...args })
            },
            error<E>(error: E) {
              connection.send({ id, error: postbox.acceptError(error) })
            },
            complete() {
              connection.send({ id, complete: true })
            }
          })

          subscriptions.add(id, subscription)
        } else if ('next' in data) {
          postbox.subjects.get(data.id)?.next(postbox.requestTransformer.prop(data.next))
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
export { SetCookie } from './http'
