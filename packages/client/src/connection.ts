import { ConnectionState, ConnectionEventMap, Connection as BridgeConnection } from 'easyhard-bridge'
import { $ } from 'easyhard-common'
import { Observable } from 'rxjs'

type Props = {
  reconnectDelay?: number
}

export type WebSocketConnection = BridgeConnection<unknown, string> & {
  readonly url: string
  close(code?: number, reason?: string): void
}

export type Connection<Args> = BridgeConnection<unknown, string> & {
  connect: <T extends WebSocketConnection>(ws: () => T, args: Args) => WebSocketConnection
  state: Observable<ConnectionState | null>
  args: Args | null
  close: () => void
}

export function createConnection<Args, T>(props: Props): Connection<Args> {
  let connection: null | { socket: WebSocketConnection, args: Args } = null
  const state = $<ConnectionState | null>(null)
  const listeners: {[key in keyof ConnectionEventMap<unknown>]: ((ev: ConnectionEventMap<string>[key]) => void)[]} = {
    open: [],
    close: [],
    error: [],
    message: []
  }

  function connect<Socket extends WebSocketConnection>(ws: () => Socket, args: Args): WebSocketConnection {
    const socket = ws()

    state.next(ConnectionState.CONNECTING)
    connection && connection.socket.close()
    connection = { socket, args }
    connection.socket.addEventListener('open', () => {
      state.next(ConnectionState.OPEN)
      listeners.open.slice().forEach(h => h(new Event('')))
    })

    connection.socket.addEventListener('close', event => {
      state.next(ConnectionState.CLOSED)
      if (!event.wasClean) setTimeout(() => connection && connect(ws, connection.args), props.reconnectDelay)
      listeners.close.slice().forEach(h => h(event))
    })

    connection.socket.addEventListener('message', event => {
      listeners.message.slice().forEach(h => h(new MessageEvent(event.type, { data: JSON.parse(event.data) })))
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
      return connection?.socket.readyState || ConnectionState.CONNECTING
    },
    get args() {
      return connection ? connection.args : null
    },
    send(data: T) {
      connection?.socket.send(JSON.stringify(data))
    },
    addEventListener(event, handler) {
      listeners[event].push(handler)
    },
    removeEventListener(event, handler) {
      const index = listeners[event].indexOf(handler)
      if (index >= 0) listeners[event].splice(index, 1)
    },
    close() {
      state.next(ConnectionState.CLOSING)
      connection && connection.socket.close()
    }
  }
}
