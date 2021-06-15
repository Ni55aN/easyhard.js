import { RequestId, Request, Response, CompleteResponse, ExtractPayload, getUID, ErrorResponse, Cookie, UnsubscribeRequest } from 'easyhard-common'
import { defer, Observable, of, Subscriber } from 'rxjs'
import { createConnection } from './connection'
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
  type ConnectionArgs = { http: string }
  type SocketResponse = Response<T, keyof T> | CompleteResponse | ErrorResponse<unknown>
  type SocketRequest = (Omit<Request<T, keyof T>, 'payload'> & { payload: TransformedPayload<Transformers> | undefined }) | UnsubscribeRequest
  const subscriptions = useSubscriptions<{ observer: Subscriber<unknown>, data: SocketRequest, afterSend?: ReturnType<typeof onSend> }>({
    onSet(item) {
      const sent = connection.send(item.data)

      if (sent && item.afterSend) {
        item.afterSend.send()
      }
    },
    onRemove(item, id) {
      if (item.afterSend) {
        item.afterSend.abort()
      }
      connection.send({ id, unsubscribe: true })
    }
  })
  const http = useHttp(() => connection.args?.http)
  const connection = createConnection<ConnectionArgs, SocketRequest, SocketResponse>({
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
        subscription.observer.error(deserializeError(data.error))
      } else {
        subscription.observer.next(data.payload)
      }
    },
    reconnectDelay
  })
  const transform = payloadTransformer<Transformers>({
    __file: item => http.transform(item),
    __cookie: item => item instanceof Cookie && getUID()
  })

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

  function call<K extends keyof T>(...args: ExtractPayload<T[K], 'request'> extends undefined ? [K] : [K, ExtractPayload<T[K], 'request'>]) {
    return new Observable<ExtractPayload<T[K], 'response'>>(observer => {
      const action = args[0]
      const payload = args[1]
      const id: RequestId = getUID()
      const transformedPayload = transform(payload)

      const data = { action, id, payload: transformedPayload }
      const afterSend = payload && transformedPayload && onSend(payload, transformedPayload, error => observer.error(error))
      subscriptions.set(id, { observer, data, afterSend })

      return () => {
        subscriptions.remove(id)
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
