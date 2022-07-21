import { Connection as BridgeConnection, ConnectionEventMap, ConnectionState } from 'easyhard-bridge'

type EventListener<E> = (ev: E) => void
export type Connection = {
  postMessage(data: any): void
  addEventListener(message: string, handler: EventListener<any>): void
  removeEventListener(message: string, handler: EventListener<any>): void
}
type Meta = { value: unknown, __easyhard?: { name: string, source: string } }


export function createConnection(target: Connection, id: string) {
  const handlers = new Map<EventListener<any>, EventListener<any>>()
  let state = ConnectionState.CONNECTING

  const con = <BridgeConnection<unknown, unknown>>{
    addEventListener: (type, handler) => {
      if (type === 'message') {
        const h: EventListener<ConnectionEventMap<unknown>['message']> = event => {
          const msg = event as { data: Meta }
          const isCompatible = typeof msg.data === 'object' && '__easyhard' in msg.data && msg.data.__easyhard?.name === 'post-message'
          const myMessage = isCompatible && msg.data.__easyhard?.source === id

          if (isCompatible && !myMessage) {
            (handler as EventListener<ConnectionEventMap<unknown>['message']>)({
              type: event.type,
              target: event.target,
              data: msg.data.value
            })
          }
        }
        handlers.set(handler, h)
        target.addEventListener('message', h)
        return
      }
      if (type === 'open') {
        target.addEventListener('load', handler)
      }
      if (type === 'close') {
        target.addEventListener('unload', handler)
      }
      target.addEventListener(type, handler)
    },
    removeEventListener: (type, handler) => {
      if (type === 'message') {
        const h = handlers.get(handler)

        if (h) {
          target.removeEventListener('message', h)
        }
        return
      }
      if (type === 'open') {
        target.removeEventListener('load', handler)
      }
      if (type === 'close') {
        target.removeEventListener('unload', handler)
      }
      target.removeEventListener(type, handler)
    },
    get readyState() {
      return state
    },
    send: value => {
      const data: Meta = { value, __easyhard: { name: 'post-message', source: id } }

      target.postMessage(data)
    }
  }

  con.addEventListener('open', () => state = ConnectionState.OPEN)
  con.addEventListener('close', () => state = ConnectionState.CLOSED)

  return con
}

