import { ExtractPayload } from 'easyhard-bridge'
import { defer, Observable, of, Subscriber } from 'rxjs'
import { createConnection } from './connection'
import { useHttp } from './http'
import { Parcel } from './parcel'
import { useSubscriptions } from './subscriptions'
import { ConnectionArgs, SocketRequest, SocketResponse } from './types'

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
  const subscriptions = useSubscriptions<{ observer: Subscriber<unknown>, parcel: Parcel<T, keyof T> }>({
    onSet(item) {
      const { parcel, observer } = item
      const sent = connection.send(parcel.getInitWSPackage())

      if (sent) {
        parcel.getHttpPackages().forEach(args => {
          http.send(parcel.id, args.headers, args.body, error => observer.error(error))
        })
      }
    },
    onRemove(item) {
      const { parcel } = item

      http.abort(parcel.id)
      connection.send(parcel.getDestroyWSPackage())
    }
  })
  const http = useHttp(() => connection.args?.http)
  const connection = createConnection<ConnectionArgs, SocketRequest<T>, SocketResponse<T>>({
    onClose(event) {
      onClose && onClose(event)
    },
    onConnect() {
      subscriptions.refresh()
      onConnect && onConnect()
    },
    onError(error) {
      onError && onError(error)
    },
    onMessage(data) {
      const subscription = subscriptions.get(data.id)

      if (!subscription) {
        return
      } else if ('complete' in data) {
        subscription.observer.complete()
      } else if ('error' in data) {
        subscription.observer.error(subscription.parcel.acceptError(data.error))
      } else {
        subscription.observer.next(subscription.parcel.acceptResponse(data.payload))
        if (data.cookie) {
          http.send(data.id, { 'easyhard-set-cookie': data.cookie })
        }
      }
    },
    reconnectDelay
  })

  function call<K extends keyof T>(...args: ExtractPayload<T[K], 'request'> extends undefined ? [K] : [K, ExtractPayload<T[K], 'request'>]) {
    return new Observable<ExtractPayload<T[K], 'response'>>(observer => {
      const action = args[0]
      const payload = args[1]
      const parcel = new Parcel(action, payload)

      subscriptions.set(parcel.id, { observer, parcel })

      return () => {
        subscriptions.remove(parcel.id)
      }
    })
  }

  return {
    connect: connection.connect,
    close,
    call,
    state: defer(() => of(connection.readyState))
  }
}
