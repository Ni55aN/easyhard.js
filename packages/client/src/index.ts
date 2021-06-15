import { RequestId, Response, CompleteResponse, ExtractPayload, getUID, ErrorResponse, Cookie } from 'easyhard-common'
import { defer, Observable, of, Subscriber } from 'rxjs'
import { useHttp } from './http'
import { useSubscriptions } from './subscriptions'
import { changeDetector, payloadTransformer, TransformedPayload } from './transform'
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
  const subscriptions = useSubscriptions<{ observer: Subscriber<unknown>, data: unknown, afterSend: any }>()
  const state = defer(() => of(connection?.socket.readyState || null))
  const http = useHttp(() => connection?.http)
  const transform = payloadTransformer<Transformers>({
    __file: item => http.transform(item),
    __cookie: item => item instanceof Cookie && getUID()
  })

  function connect(url: string, http: string) {
    connection = { socket: new WebSocket(url), http }

    connection.socket.onopen = () => {
      subscriptions.list().forEach(sub => {
        send(sub.data)
        sub.afterSend.send()
      })
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

  function send<T>(data: T) {
    if (connection && connection.socket.readyState === connection.socket.OPEN) {
      connection.socket.send(JSON.stringify(data))
      return true
    }
  }

  const onSend = <K extends keyof T, D extends TransformedPayload<Transformers>>(
    payload: ExtractPayload<T[K], 'request'>,
    transformedPayload: D,
    onError: (error: Error) => void
  ) => {
    const getChangesByKey = changeDetector<Transformers>()
    let xhrs: null | XMLHttpRequest[] = null

    return {
      send() {
        xhrs = [
          ...getChangesByKey('__file', payload, transformedPayload).map(item => http.upload(item.to, item.from, onError)),
          ...getChangesByKey('__cookie', payload, transformedPayload).map(item => http.sendCookie(item.to, item.from.key, onError))
        ]
      },
      abort() {
        xhrs && xhrs.forEach(xhr => xhr.abort())
      }
    }
  }

  function close() {
    connection && connection.socket.close()
  }

  function call<K extends keyof T>(...args: ExtractPayload<T[K], 'request'> extends undefined ? [K] : [K, ExtractPayload<T[K], 'request'>]) {
    return new Observable<ExtractPayload<T[K], 'response'>>(observer => {
      const action = args[0]
      const payload = args[1]
      const transformedPayload = transform(payload)
      const id: RequestId = getUID()

      const data = { action, id, payload: transformedPayload }
      const afterSend = payload && transformedPayload && onSend(payload, transformedPayload, error => observer.error(error))
      subscriptions.add(id, { observer, data, afterSend })

      const sent = send(data)

      if (sent && afterSend) {
        afterSend.send()
      }
      return () => {
        afterSend && afterSend.abort()
        send({ id, unsubscribe: true })
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
