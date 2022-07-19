import { ConnectionState, Connection, ConnectionEventMap } from 'easyhard-bridge'
import { WebSocket } from 'uWebSockets.js'

export class ConnectionAdapter implements Connection<unknown, unknown> {
  private listeners: {[K in keyof ConnectionEventMap<unknown>]: ((ev: ConnectionEventMap<unknown>[K]) => void)[]} = {
    close: [],
    error: [],
    message: [],
    open: []
  }
  readyState = ConnectionState.CONNECTING

  constructor(private ws: WebSocket) {}

  emit<K extends keyof ConnectionEventMap<unknown>>(event: K, payload:  ConnectionEventMap<unknown>[K]) {
    this.listeners[event].forEach(hander => hander(payload))
  }

  addEventListener<K extends keyof ConnectionEventMap<unknown>>(event: K, handler: (ev: ConnectionEventMap<unknown>[K]) => void) {
    this.listeners[event].push(handler)
  }

  removeEventListener<K extends keyof ConnectionEventMap<unknown>>(event: K, handler: (ev: ConnectionEventMap<unknown>[K]) => void) {
    const listenersToRemove = [...this.listeners[event]].filter(h => h === handler)

    listenersToRemove.forEach(item => {
      const index = this.listeners[event].indexOf(item)

      if (index >= 0) this.listeners[event].splice(index, 1)
    })
  }

  send<T>(data: T) {
    this.ws.send(JSON.stringify(data))
  }
}
