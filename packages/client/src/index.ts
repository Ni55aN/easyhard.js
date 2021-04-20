import { RequestId, Response, CompleteResponse } from 'easyhard-common'
import { Observable, Subscriber } from 'rxjs'

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
  const subscriptions: {[key in RequestId]: { observer: Subscriber<unknown>, data: string }} = {}

  function connect(url: string) {
    socket = new WebSocket(url)

    socket.onopen = () => {
      Object.values(subscriptions).forEach(sub => socket?.send(sub.data))
      onConnect && onConnect()
    }

    socket.onclose = event => {
      if (!event.wasClean) setTimeout(connect, reconnectDelay)
      onClose && onClose(event)
    }

    socket.onmessage = event => {
      const data: Response<T, keyof T> | CompleteResponse = JSON.parse(event.data)
      const subscription = subscriptions[data.id]

      if (!subscription) {
        throw new Error('The subscription has been deleted, but the server is still sending data')
      }

      if ('complete' in data) {
        subscription.observer.complete()
      } else {
        subscription.observer.next(data.payload)
      }
    }
    
    socket.onerror = function(error) {
      onError && onError(error as unknown as Error)
    }
  }
  
  function close() {
    socket && socket.close()
  }

  function call<K extends keyof T>(action: K, payload?: T[K] extends { request?: unknown } ? T[K]['request'] : undefined) {
    const id: RequestId = Math.random().toString(16)

    return new Observable<T[K] extends { response: unknown } ? T[K]['response'] : (T[K] extends { response?: unknown } ? T[K]['response'] : void)>(observer => {
      const data = JSON.stringify({ action, id, payload })
      subscriptions[id] = { observer, data }

      if (socket && socket.readyState === socket.OPEN) {
        socket.send(data)
      }

      return () => {
        delete subscriptions[id]
      }
    })
  }

  return {
    connect,
    close,
    call
  }
}
