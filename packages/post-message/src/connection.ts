import { Connection as BridgeConnection, ConnectionEventMap, ConnectionState } from 'easyhard-bridge'

type Connection = Pick<BridgeConnection<unknown, unknown>, 'addEventListener' | 'removeEventListener'> & { postMessage: (data: unknown) => void}
type Meta = { value: unknown, __easyhard?: { name: string, source: string } }


export function createConnection(target: Connection, id: string) {
  type MessageHandler = (ev: ConnectionEventMap<unknown>['message']) => void

  const handlers = new Map<MessageHandler, MessageHandler>()

  return <BridgeConnection<unknown, unknown>>{
    addEventListener: (type, handler) => {
      if (type === 'message') {
        const h: MessageHandler = event => {
          const msg = event as { data: Meta }
          const isCompatible = typeof msg.data === 'object' && '__easyhard' in msg.data && msg.data.__easyhard?.name === 'post-message'
          const myMessage = isCompatible && msg.data.__easyhard?.source === id

          if (isCompatible && !myMessage) {
            (handler as MessageHandler)({ type: event.type, target: event.target, data: msg.data.value })
          }
        }
        handlers.set(handler as MessageHandler, h)
        target.addEventListener('message', h)
      }
    },
    removeEventListener: (type, handler) => {
      if (type === 'message') {
        const h = handlers.get(handler as MessageHandler)

        target.removeEventListener('message', h as MessageHandler)
      }
    },
    readyState: ConnectionState.OPEN,
    send: value => {
      const data: Meta = { value, __easyhard: { name: 'post-message', source: id } }

      target.postMessage(data)
    }
  }
}

