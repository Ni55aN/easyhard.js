import { WebSocketState } from 'easyhard-bridge'

type Props = {
  reconnectDelay?: number
}

type Return<Args> = {
  connect: <T extends WebSocketConnection>(ws: () => T, args: Args) => T
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
  const listeners: {[key: string]: any[]} = {
    open: [],
    close: [],
    error: [],
    message: []
  }

  function connect<Socket extends WebSocketConnection | WebSocket>(ws: () => Socket, args: Args): Socket {
    const socket = ws()

    connection = { socket, args }
    connection.socket.onopen = () => {
      listeners.open.forEach(h => h())
    }

    connection.socket.onclose = (event: CloseEvent) => {
      if (!event.wasClean) setTimeout(() => connection && connect(ws, connection.args), props.reconnectDelay)
      listeners.close.forEach(h => h(event))
    }

    connection.socket.onmessage = (event: MessageEvent) => {
      listeners.message.forEach(h => h(event))
    }

    connection.socket.onerror = function(error: ErrorEvent) {
      listeners.error.forEach(h => h(error))
    }

    return connection.socket as Socket
  }

  return {
    connect,
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
      connection && connection.socket.close()
    }
  }
}
