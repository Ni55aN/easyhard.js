import { WebSocketState } from 'easyhard-bridge'

type Props = {
  reconnectDelay?: number;
}

type Return<Args> = {
  connect: (url: string, args: Args) => WebSocket
  readyState: number
  args: Args | null
  send: (data: any) => boolean | void
  addEventListener: (event: any, handler: any) => void
  removeEventListener: (event: any, handler: any) => void
  close: () => void
}

export function createConnection<Args>(props: Props): Return<Args> {
  let connection: null | { socket: WebSocket, args: Args } = null
  const listeners: {[key: string]: any[]} = {
    open: [],
    close: [],
    error: [],
    message: []
  }

  function connect(url: string, args: Args) {
    const socket = new WebSocket(url)

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
