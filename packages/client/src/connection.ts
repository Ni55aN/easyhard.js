
type Props<In> = {
  reconnectDelay?: number;
  onConnect: () => void;
  onMessage: (data: In) => void;
  onError: (error: Error) => void;
  onClose: (event: CloseEvent) => void;
}

type Return<Args, Out> = {
  connect: (url: string, args: Args) => void
  readyState: number | null
  args: Args | null
  send: (data: Out) => boolean | void
  close: () => void
}

export function createConnection<Args, Out, In>(props: Props<In>): Return<Args, Out> {
  let connection: null | { socket: WebSocket, args: Args } = null

  function connect(url: string, args: Args) {
    connection = { socket: new WebSocket(url), args }

    connection.socket.onopen = () => {
      props.onConnect()
    }

    connection.socket.onclose = event => {
      if (!event.wasClean) setTimeout(() => connection && connect(connection.socket.url, connection.args), props.reconnectDelay)
      props.onClose(event)
    }

    connection.socket.onmessage = event => {
      props.onMessage(JSON.parse(event.data))
    }

    connection.socket.onerror = function(error) {
      props.onError(error as unknown as Error)
    }

    return connection.socket
  }

  return {
    connect,
    get readyState() {
      return connection?.socket.readyState || null
    },
    get args() {
      return connection ? connection.args : null
    },
    send(data: Out) {
      if (connection && connection.socket.readyState === connection.socket.OPEN) {
        connection.socket.send(JSON.stringify(data))
        return true
      }
    },
    close() {
      connection && connection.socket.close()
    }
  }
}
