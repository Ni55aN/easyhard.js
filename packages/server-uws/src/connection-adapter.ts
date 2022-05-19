import { WebSocketState, WsConnection } from 'easyhard-bridge'
import { RecognizedString, WebSocket } from 'uWebSockets.js'

type Listener = [string, (...args: unknown[]) => unknown]

export class ConnectionAdapter implements WsConnection {
  private listeners: Listener[] = []
  readyState = WebSocketState.CONNECTING

  constructor(private ws: WebSocket) {}

  emit<T>(event: string, payload: T) {
    this.listeners
      .filter(e => e[0] === event)
      .forEach(e => e[1](payload))
  }

  addEventListener(event: string, handler: (props: unknown) => void) {
    this.listeners.push([event, handler])
  }

  removeEventListener(event: string, handler: (props: unknown) => void) {
    const listenersToRemove = [...this.listeners].filter(e => e[0] === event && e[1] === handler)

    listenersToRemove.forEach(item => {
      const index = this.listeners.indexOf(item)

      if (index >= 0) this.listeners.splice(index, 1)
    })
  }

  send(data: RecognizedString) {
    this.ws.send(data)
  }
}
