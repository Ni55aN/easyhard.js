import { WebSocketState, WebSocketEventMap, WsConnection } from 'easyhard-bridge'
import { $ } from 'easyhard-common'
import { Observable } from 'rxjs'

type Props = {
  reconnectDelay?: number
}

export type WebSocketConnection = WsConnection & {
  readonly url: string
  close(code?: number, reason?: string): void
}

export type Connection<Args> = WsConnection & {
  connect: <T extends WebSocketConnection>(ws: () => T, args: Args) => WebSocketConnection
  state: Observable<WebSocketState | null>
  args: Args | null
  close: () => void
}

export function createConnection<Args>(props: Props): Connection<Args> {
  let connection: null | { socket: WebSocketConnection, args: Args } = null
  const state = $<WebSocketState | null>(null)
  const listeners: {[key in keyof WebSocketEventMap]: ((ev: WebSocketEventMap[key]) => void)[]} = {
    open: [],
    close: [],
    error: [],
    message: []
  }

  function connect<Socket extends WebSocketConnection>(ws: () => Socket, args: Args): WebSocketConnection {
    const socket = ws()

    state.next(WebSocketState.CONNECTING)
    connection && connection.socket.close()
    connection = { socket, args }
    connection.socket.addEventListener('open', () => {
      state.next(WebSocketState.OPEN)
      listeners.open.slice().forEach(h => h(new Event('')))
    })

    connection.socket.addEventListener('close', event => {
      state.next(WebSocketState.CLOSED)
      if (!event.wasClean) setTimeout(() => connection && connect(ws, connection.args), props.reconnectDelay)
      listeners.close.slice().forEach(h => h(event))
    })

    connection.socket.addEventListener('message', event => {
      listeners.message.slice().forEach(h => h(event))
    })

    connection.socket.addEventListener('error', error => {
      listeners.error.slice().forEach(h => h(error))
    })

    return connection.socket
  }

  return {
    connect,
    state: state.asObservable(),
    get readyState() {
      return connection?.socket.readyState || WebSocketState.CONNECTING
    },
    get args() {
      return connection ? connection.args : null
    },
    send(data: string | ArrayBufferLike | Blob | ArrayBufferView) {
      connection?.socket.send(data)
    },
    addEventListener(event, handler) {
      listeners[event].push(handler)
    },
    removeEventListener(event, handler) {
      const index = listeners[event].indexOf(handler)
      if (index >= 0) listeners[event].splice(index, 1)
    },
    close() {
      state.next(WebSocketState.CLOSING)
      connection && connection.socket.close()
    }
  }
}
