import { Observable, of, OperatorFunction, Subscriber, Subscription } from 'rxjs'
import { getUID } from 'easyhard-common'

export type RequestId = string
type UnsubscribeRequest = { id: RequestId, unsubscribe: true }

type CompleteResponse = { id: RequestId, complete: true }
type ErrorResponse<T> = { id: RequestId, error: T }

type Key = string | number | symbol
type ClientToServer<K, P> = { key: K, id: RequestId, params: P, subscribe: true } | UnsubscribeRequest
type ServerToClient<T> = { id: RequestId, value: T } | ErrorResponse<Error> | CompleteResponse

export enum WebSocketState {
  CONNECTING = 0,
  OPEN = 1,
  CLOSING = 2,
  CLOSED = 3,
}

export type WsConnection = {
  readyState: number
  send: (data: any) => void
  addEventListener: (event: any, handler: (props: any) => void) => void
  removeEventListener: (event: any, handler: any) => void
}

type BindProps = {
  subscribe?: (id: string, subscriber: Subscriber<unknown>) => void
  unsubscribe?: (id: string, subscriber: Subscriber<unknown>) => void
}

export function bindObservable<P, T>(key: Key, params: P, client: WsConnection, props?: BindProps): Observable<T> {
  const send = <T extends ClientToServer<Key, P>>(data: T) => {
    if (client.readyState === WebSocketState.OPEN) {
      client.send(JSON.stringify(data))
    } else if (client.readyState === WebSocketState.CONNECTING) {
      client.addEventListener('open', () => client.send(JSON.stringify(data)))
    }
  }
  return new Observable<T>(subscriber => {
    const id = getUID()
    const onClose = (event: CloseEvent) => {
      try {
        subscriber.error(new Error(`WS closed: ${event.code} ${event.reason}`))
      } catch(e) {
        console.log('onClose:', e)
      }
    }
    const onError = (error: Error) => {
      subscriber.error(error)
    }
    client.addEventListener('close', onClose)
    client.addEventListener('error', onError)
    send({ key, id, params, subscribe: true })
    props?.subscribe && props?.subscribe(id, subscriber)

    const handler = (event: { data: string }) => {
      const data: ServerToClient<T> = JSON.parse(event.data)
      if ('value' in data && data.id === id) subscriber.next(data.value)
      if ('error' in data && data.id === id) subscriber.error(data.error)
      if ('complete' in data && data.id === id) subscriber.complete()
    }
    client.addEventListener('message', handler)
    return () => {
      client.removeEventListener('message', handler)
      client.removeEventListener('close', onClose)
      client.removeEventListener('error', onError)
      subscriber.unsubscribe()
      send({ id, unsubscribe: true })
      props?.unsubscribe && props?.unsubscribe(id, subscriber)
    }
  })
}

type RegisterProps = {
  subscribe?: (id: string) => void
  unsubscribe?: (id: string) => void
}

export function registerObservable<P, T>(key: Key, stream: Observable<T> | OperatorFunction<P, T>, connection: WsConnection, props?: RegisterProps): () => void {
  const subscriptions = new Map<string, Subscription>()
  function send<D extends ServerToClient<T>>(data: D) {
    if (connection.readyState === WebSocketState.OPEN) {
      connection.send(JSON.stringify(data))
    }
  }
  function unsubscribe(id: string) {
    const subscription = subscriptions.get(id)
    if (subscription) {
      try {
        subscription.unsubscribe()
      } catch(e) {
        console.log('unsubscribe error: ', e)
      } finally {
        subscriptions.delete(id)
        props?.unsubscribe && props?.unsubscribe(id)
      }
    }
  }
  const onClose = () => {
    Array.from(subscriptions.keys()).forEach(unsubscribe)
  }
  const onMessage = (event: { data: any }) => {
    const data: ClientToServer<Key, P> = JSON.parse(event.data)

    if ('subscribe' in data && data.key === key) {
      const subscription = (stream instanceof Observable ? stream : of(data.params).pipe(stream)).subscribe({
        next(value) {
          send({ id: data.id, value })
        },
        error(error) {
          send({ id: data.id, error })
        },
        complete() {
          send({ id: data.id, complete: true })
        }
      })

      subscriptions.set(data.id, subscription)
      props?.subscribe && props?.subscribe(data.id)
    } else if ('unsubscribe' in data) {
      unsubscribe(data.id)
    }
  }
  connection.addEventListener('close', onClose)
  connection.addEventListener('message', onMessage)

  return () => {
    connection.removeEventListener('close', onClose)
    connection.removeEventListener('message', onMessage)
    onClose()
  }
}
