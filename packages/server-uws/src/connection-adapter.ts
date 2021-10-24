import { WebSocketState, WsConnection } from 'easyhard-bridge'
import { WebSocket } from 'uWebSockets.js'

type Listener = [string, (...args: any[]) => any]

export class ConnectionAdapter implements WsConnection {
  private listeners: Listener[] = []
  readyState = WebSocketState.CONNECTING

  constructor(private ws: WebSocket) {}

  emit<T>(event: string, payload: T) {
    this.listeners
      .filter(e => e[0] === event)
      .forEach(e => e[1](payload))
  }

  addEventListener(event: any, handler: (props: any) => void) {
    this.listeners.push([event, handler])
  }

  removeEventListener(event: any, handler: any) {
    const listenersToRemove = [...this.listeners].filter(e => e[0] === event && e[1] === handler)

    listenersToRemove.forEach(item => {
      const index = this.listeners.indexOf(item)

      if (index >= 0) this.listeners.splice(index, 1)
    })
  }

  send(data: any) {
    this.ws.send(data)
  }
}
