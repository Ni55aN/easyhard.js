import { ExtractPayload, Response, Request, CompleteResponse } from 'easyhard-common'
import * as ws from 'ws'
import { Observable } from 'rxjs'

export type Handler<T> = (
    payload: ExtractPayload<T, 'request'>
  ) => Observable<ExtractPayload<T, 'response'>>

export type Handlers<T> = {
  [K in keyof T]: Handler<T[K]>
}

export function easyhardServer<T>(actions: Handlers<T>): { attachClient: (connection: ws) => void } {
  function attachClient(connection: ws) {
    connection.on('message', data => {
      const reqData: Request<T, keyof T> = JSON.parse(data.toString('utf-8'))
      const handler = actions[reqData.action]

      handler(reqData.payload).subscribe({
        next(payload) {
          if (connection.readyState === connection.OPEN) {
            const response: Response<T, keyof T> = { id: reqData.id, payload }

            connection.send(JSON.stringify(response))
          }
        },
        complete() {
          const response: CompleteResponse = { id: reqData.id, complete: true }

          if (connection.readyState === connection.OPEN) {
            connection.send(JSON.stringify(response))
          }
        }
      })
    })
  }

  return {
    attachClient
  }
}

