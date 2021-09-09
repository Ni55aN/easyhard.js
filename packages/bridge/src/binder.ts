import { Observable, OperatorFunction, Subscriber, Subscription } from 'rxjs'
import { getUID } from 'easyhard-common'
import { NOT_FOUND_STREAM_ERROR } from './constants'
import { sanitize } from './utils'

export type RequestId = string
type UnsubscribeRequest = { id: RequestId, unsubscribe: true }

type CompleteResponse = { id: RequestId, complete: true }
type ErrorResponse<T> = { id: RequestId, error: T }

type Key = string | number | symbol
type ClientToServer<K> = { key: K, id: RequestId, source: RequestId | null, subscribe: true } | UnsubscribeRequest
type ServerToClient<T> = { id: RequestId, value: T } | ErrorResponse<string> | CompleteResponse

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

export function bindObservable<T>(key: Key, source: RequestId | null, client: WsConnection, props?: BindProps): Observable<T> {
  return new Observable<T>(subscriber => {
    const nextData: ClientToServer<Key>[] = []
    const send = <T extends ClientToServer<Key>>(data: T) => {
      if (client.readyState === WebSocketState.OPEN) {
        try {
          client.send(JSON.stringify(data))
        } catch (error) {
          subscriber.error(error)
        }
      } else {
        nextData.push(data)
      }
    }

    const id = getUID()
    const onClose = (event: CloseEvent) => {
      try {
        subscriber.error(new Error(`WS closed: ${event.code} ${event.reason}`))
      } catch(e) {
        console.log('onClose:', e)
      }
    }
    const onOpen = () => {
      while(nextData.length > 0) {
        const data = nextData.shift()
        data && send(data)
      }
    }
    const onError = (error: Error) => {
      subscriber.error(error)
    }
    client.addEventListener('open', onOpen)
    client.addEventListener('close', onClose)
    client.addEventListener('error', onError)
    send({ key, id, source, subscribe: true })
    props?.subscribe && props?.subscribe(id, subscriber)

    const handler = (event: { data: string }) => {
      const data: ServerToClient<T> = JSON.parse(event.data)

      if (data.id !== id) return
      else if ('error' in data) subscriber.error(data.error)
      else if ('complete' in data) subscriber.complete()
      else subscriber.next(data.value)
    }
    client.addEventListener('message', handler)
    return () => {
      client.removeEventListener('message', handler)
      client.removeEventListener('open', onOpen)
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
      try {
        connection.send(JSON.stringify(data))
      } catch (error) {
        send({ id: data.id, error: sanitize(error) })
      }
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
    const data: ClientToServer<Key> = JSON.parse(event.data)

    if ('subscribe' in data && data.key === key) {
      const observable = stream instanceof Observable
        ? stream
        : (data.source ? bindObservable<P>(data.source, null, connection).pipe(stream) : null)

      if (!observable) {
        return send({ id: data.id, error: NOT_FOUND_STREAM_ERROR })
      }

      const subscription = observable.subscribe({
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
