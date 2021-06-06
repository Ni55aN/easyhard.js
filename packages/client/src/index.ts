import { $, RequestId, Request, Response, CompleteResponse, UnsubscribeRequest, ExtractPayload, getUID, ErrorResponse } from 'easyhard-common'
import { defer, Observable, of, Subscriber } from 'rxjs'
import { useSubscriptions } from './subscriptions'
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
  let socket: null | WebSocket = null
  const subscriptions = useSubscriptions<{ observer: Subscriber<unknown>, data: unknown }>()
  const state = defer(() => of(socket?.readyState || null))

  function connect(url: string) {
    socket = new WebSocket(url)

    socket.onopen = () => {
      subscriptions.list().forEach(sub => send(sub.data))
      onConnect && onConnect()
    }

    socket.onclose = event => {
      if (!event.wasClean) setTimeout(() => socket && connect(socket.url), reconnectDelay)
      onClose && onClose(event)
    }

    socket.onmessage = event => {
      const data: Response<T, keyof T> | CompleteResponse | ErrorResponse<unknown> = JSON.parse(event.data)
      const subscription = subscriptions.get(data.id)

      if (!subscription) {
        throw new Error('The subscription has been deleted, but the server is still sending data')
      }

      if ('complete' in data) {
        subscription.observer.complete()
      } else if ('error' in data) {
        subscription.observer.error(deserializeError(data.error))
      } else {
        subscription.observer.next(data.payload)
      }
    }

    socket.onerror = function(error) {
      onError && onError(error as unknown as Error)
    }
  }

  function send<T>(data: T) {
    if (socket && socket.readyState === socket.OPEN) {
      socket.send(JSON.stringify(data))
    }
  }

  function close() {
    socket && socket.close()
  }

  function call<K extends keyof T>(action: K, payload?: ExtractPayload<T[K], 'request'>) {
    return new Observable<ExtractPayload<T[K], 'response'>>(observer => {
      const id: RequestId = getUID()
      const data: Request<T, K> = { action, id, payload }
      subscriptions.add(id, { observer, data })

      send(data)

      return () => {
        send<UnsubscribeRequest>({ id, unsubscribe: true })
        subscriptions.remove(id)
      }
    })
  }

  return {
    connect,
    close,
    call,
    state,
    socket
  }
}
