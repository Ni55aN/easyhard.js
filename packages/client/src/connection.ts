import { WebSocketState } from 'easyhard-bridge'

type Props<WS> = {
  reconnectDelay?: number;
  ws: (url: string) => WS
}

type Return<Args, WS> = {
  connect: (url: string, args: Args) => WS
  readyState: number
  args: Args | null
  send: (data: any) => boolean | void
  addEventListener: (event: any, handler: any) => void
  removeEventListener: (event: any, handler: any) => void
  close: () => void
}

interface CloseEvent {
  wasClean: boolean;
  code: number;
  reason: string;
  target: any;
}
interface ErrorEvent {
    error: any;
    message: string;
    type: string;
    target: any;
}
type Data = string | Buffer | ArrayBuffer | Buffer[];
interface MessageEvent {
    data: Data;
    type: string;
    target: any;
}
interface OpenEvent {
    target: any;
}
export type WebSocket = {
  url: string
  readyState: WebSocketState
  onclose: ((this: WebSocket, ev: CloseEvent) => any) | null;
  onerror: ((this: WebSocket, ev: ErrorEvent) => any) | null;
  onmessage: ((this: WebSocket, ev: MessageEvent) => any) | null;
  onopen: ((this: WebSocket, ev: OpenEvent) => any) | null;
  send(data: string | ArrayBufferLike | Blob | ArrayBufferView): void;
  close(code?: number, reason?: string): void;
}

export function createConnection<Args, WS extends WebSocket>(props: Props<WS>): Return<Args, WS> {
  let connection: null | { socket: WS, args: Args } = null
  const listeners: {[key: string]: any[]} = {
    open: [],
    close: [],
    error: [],
    message: []
  }

  function connect(url: string, args: Args) {
    const socket = props.ws(url)

    connection = { socket, args }
    connection.socket.onopen = () => {
      listeners.open.forEach(h => h())
    }

    connection.socket.onclose = (event) => {
      if (!event.wasClean) setTimeout(() => connection && connect(connection.socket.url, connection.args), props.reconnectDelay)
      listeners.close.forEach(h => h(event))
    }

    connection.socket.onmessage = (event) => {
      listeners.message.forEach(h => h(event))
    }

    connection.socket.onerror = function(...args) {
      listeners.error.forEach(h => h(...args))
    }

    return connection.socket
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
