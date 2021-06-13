import { RequestId, Request, Response, CompleteResponse, UnsubscribeRequest, ExtractPayload, getUID, ErrorResponse } from 'easyhard-common'
import { defer, Observable, of, Subscriber } from 'rxjs'
import { useHttp } from './http'
import { useSubscriptions } from './subscriptions'
import { payloadTransformer } from './transform'
import { Transformers } from './types'
import { deserializeError } from './utils'

type Props = {
  reconnectDelay?: number;
  onConnect?: () => void;
  onError?: (error: Error) => void;
  onClose?: (event: CloseEvent) => void;
}

/* eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types */
export function easyhardClient<T>({
  reconnectDelay = 5000,
  onConnect,
  onError,
  onClose
}: Props = {}) {
  let connection: null | { socket: WebSocket, http: string } = null
  const subscriptions = useSubscriptions<{ observer: Subscriber<unknown>, data: Request<T, keyof T> }>()
  const state = defer(() => of(connection?.socket.readyState || null))
  const http = useHttp(() => connection?.http)
  const transform = payloadTransformer<Transformers>({
    __file: item => http.transform(item)
  })

  function connect(url: string, http: string) {
    connection = { socket: new WebSocket(url), http }

    connection.socket.onopen = () => {
      subscriptions.list().forEach(sub => send<T, keyof T, Request<T, keyof T>>(sub.data))
      onConnect && onConnect()
    }

    connection.socket.onclose = event => {
      if (!event.wasClean) setTimeout(() => connection && connect(connection.socket.url, http), reconnectDelay)
      onClose && onClose(event)
    }

    connection.socket.onmessage = event => {
      const data: Response<T, keyof T> | CompleteResponse | ErrorResponse<unknown> = JSON.parse(event.data)
      const subscription = subscriptions.get(data.id)

      if (!subscription) {
        return
      } else if ('complete' in data) {
        subscription.observer.complete()
      } else if ('error' in data) {
        subscription.observer.error(deserializeError(data.error))
      } else {
        subscription.observer.next(data.payload)
      }
    }

    connection.socket.onerror = function(error) {
      onError && onError(error as unknown as Error)
    }

    return connection.socket
  }

  function send<T, K extends keyof T, P extends Request<T, K> | UnsubscribeRequest>(data: P) {
    if (connection && connection.socket.readyState === connection.socket.OPEN) {
      const payload = 'payload' in data ? (data as Request<T, K>).payload : undefined
      const transformedData = transform(payload)

      connection.socket.send(JSON.stringify({ ...data, payload: transformedData.payload }))

      return transformedData
    }
  }

  function close() {
    connection && connection.socket.close()
  }

  function call<K extends keyof T>(...args: ExtractPayload<T[K], 'request'> extends undefined ? [K] : [K, ExtractPayload<T[K], 'request'>]) {
    return new Observable<ExtractPayload<T[K], 'response'>>(observer => {
      const [action, payload] = args
      const id: RequestId = getUID()
      const data: Request<T, K> = { action, id, payload: payload as ExtractPayload<T[K], 'request'> }
      subscriptions.add(id, { observer, data })

      const transformedData = send<T, K, Request<T, K>>(data)
      const xhrs = transformedData ? transformedData.getByKey('__file').map(item => http.upload(item.to, item.from)) : []

      return () => {
        xhrs.forEach(xhr => xhr.abort())
        send<T, K, UnsubscribeRequest>({ id, unsubscribe: true })
        subscriptions.remove(id)
      }
    })
  }

  return {
    connect,
    close,
    call,
    state
  }
}
