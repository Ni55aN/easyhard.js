import { WebSocketState, WsConnection, WebSocketEventMap } from 'easyhard-bridge'
import { RecognizedString, WebSocket } from 'uWebSockets.js'

export class ConnectionAdapter implements WsConnection {
  private listeners: {[K in keyof WebSocketEventMap]: ((ev: WebSocketEventMap[K]) => void)[]} = {
    close: [],
    error: [],
    message: [],
    open: []
  }
  readyState = WebSocketState.CONNECTING

  constructor(private ws: WebSocket) {}

  emit<K extends keyof WebSocketEventMap>(event: K, payload:  WebSocketEventMap[K]) {
    this.listeners[event].forEach(hander => hander(payload))
  }

  addEventListener<K extends keyof WebSocketEventMap>(event: K, handler: (ev: WebSocketEventMap[K]) => void) {
    this.listeners[event].push(handler)
  }

  removeEventListener<K extends keyof WebSocketEventMap>(event: K, handler: (ev: WebSocketEventMap[K]) => void) {
    const listenersToRemove = [...this.listeners[event]].filter(h => h === handler)

    listenersToRemove.forEach(item => {
      const index = this.listeners[event].indexOf(item)

      if (index >= 0) this.listeners[event].splice(index, 1)
    })
  }

  send(data: RecognizedString) {
    this.ws.send(data)
  }
}
