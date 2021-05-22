import { Response, Request, CompleteResponse, UnsubscribeRequest, ErrorResponse } from 'easyhard-common'
import * as ws from 'ws'
import { useSubscriptions } from './subscriptions'
import { Handlers } from './types'
import { serializeError } from './utils'

function send<T>(connection: ws, data: T) {
  if (connection.readyState === connection.OPEN) {
    connection.send(JSON.stringify(data, serializeError))
  }
}

export function easyhardServer<T>(actions: Handlers<T>): { attachClient: (connection: ws) => void } {
  function attachClient(connection: ws) {
    const subscriptions = useSubscriptions()

    connection.on('message', data => {
      const request: Request<T, keyof T> | UnsubscribeRequest = JSON.parse(data.toString('utf-8'), serializeError)
      const id = request.id

      if ('unsubscribe' in request) {
        subscriptions.remove(id)
      } else if ('action' in request) {
        const handler = actions[request.action]
        const subscription = handler(request.payload).subscribe({
          next(payload) {
            send<Response<T, keyof T>>(connection, { id, payload })
          },
          error<E>(error: E) {
            send<ErrorResponse<E>>(connection, { id, error })
          },
          complete() {
            send<CompleteResponse>(connection, { id, complete: true })
          }
        })

        subscriptions.add(id, subscription)
      } else {
        throw new Error('WS message isn\'t recognized')
      }
    })

    connection.on('close', () => {
      subscriptions.clear()
    })
  }

  return {
    attachClient
  }
}
