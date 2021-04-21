import { ExtractPayload, Response, Request, CompleteResponse, UnsubscribeRequest } from 'easyhard-common'
import * as ws from 'ws'
import { Observable, Subscription } from 'rxjs'

export type Handler<T> = (
    payload?: ExtractPayload<T, 'request'>
  ) => Observable<ExtractPayload<T, 'response'>>

export type Handlers<T> = {
  [K in keyof T]: Handler<T[K]>
}

export function easyhardServer<T>(actions: Handlers<T>): { attachClient: (connection: ws) => void } {
  function attachClient(connection: ws) {
    const subscriptions: {[key: string]: Subscription } = {}

    connection.on('message', data => {
      const reqData: Request<T, keyof T> | UnsubscribeRequest = JSON.parse(data.toString('utf-8'))
      const id = reqData.id

      if ('unsubscribe' in reqData) {
        subscriptions[id].unsubscribe()
        delete subscriptions[id]
      } else if ('action' in reqData) {
        const handler = actions[reqData.action]

        subscriptions[id] = handler(reqData.payload).subscribe({
          next(payload) {
            if (connection.readyState === connection.OPEN) {
              const response: Response<T, keyof T> = { id, payload }

              connection.send(JSON.stringify(response))
            }
          },
          complete() {
            const response: CompleteResponse = { id, complete: true }

            if (connection.readyState === connection.OPEN) {
              connection.send(JSON.stringify(response))
            }
          }
        })
      } else {
        throw new Error(`WS message isn't recognized`)
      }
    })
  }

  return {
    attachClient
  }
}

