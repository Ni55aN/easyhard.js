import { WebSocketState } from 'easyhard-bridge'
import { $ } from 'easyhard-common'
import { Observable } from 'rxjs'

type Props = {
  reconnectDelay?: number
}

type Return<Args> = {
  connect: <T extends WebSocketConnection>(ws: () => T, args: Args) => T
  state: Observable<WebSocketState | null>
  readyState: number
  args: Args | null
  send: (data: any) => boolean | void
  addEventListener: (event: any, handler: any) => void
  removeEventListener: (event: any, handler: any) => void
  close: () => void
}

interface CloseEvent {
  readonly code: number;
  readonly reason: string;
  readonly wasClean: boolean;
  target: any
}
interface ErrorEvent {
  readonly error: any;
  readonly message: string;
  readonly type: string;
  target: any;
}

interface MessageEvent {
  data: any;
  type: string;
  target: any;
}

export type WebSocketConnection = {
  url: string
  readyState: WebSocketState
  onclose: ((ev: any) => any) | null;
  onerror: ((ev: any) => any) | null;
  onmessage: ((ev: any) => any) | null;
  onopen: ((ev: any) => any) | null;
  send(data: string | ArrayBufferLike | Blob | ArrayBufferView): void;
  close(code?: number, reason?: string): void;
}

export function createConnection<Args>(props: Props): Return<Args> {
  let connection: null | { socket: WebSocketConnection | WebSocket, args: Args } = null
  const state = $<WebSocketState | null>(null)
  const listeners: {[key: string]: any[]} = {
    open: [],
    close: [],
    error: [],
    message: []
  }

  function connect<Socket extends WebSocketConnection | WebSocket>(ws: () => Socket, args: Args): Socket {
    const socket = ws()

    state.next(WebSocketState.CONNECTING)
    connection && connection.socket.close()
    connection = { socket, args }
    connection.socket.onopen = () => {
      state.next(WebSocketState.OPEN)
      listeners.open.slice().forEach(h => h())
    }

    connection.socket.onclose = (event: CloseEvent) => {
      state.next(WebSocketState.CLOSED)
      if (!event.wasClean) setTimeout(() => connection && connect(ws, connection.args), props.reconnectDelay)
      listeners.close.slice().forEach(h => h(event))
    }

    connection.socket.onmessage = (event: MessageEvent) => {
      listeners.message.slice().forEach(h => h(event))
    }

    connection.socket.onerror = function(error: ErrorEvent) {
      listeners.error.slice().forEach(h => h(error))
    }

    return connection.socket as Socket
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
    send(data: any) {
      connection?.socket.send(data)
    },
    addEventListener(event: any, handler: any) {
      listeners[event].push(handler)
    },
    removeEventListener(event: any, handler: any) {
      const index = listeners[event].indexOf(handler)
      if (index >= 0) listeners[event].splice(index, 1)
    },
    close() {
      state.next(WebSocketState.CLOSING)
      connection && connection.socket.close()
    }
  }
}
