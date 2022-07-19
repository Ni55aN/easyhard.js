import { Connection, ConnectionEventMap } from './binder'

export function connectionSerializer<I, O, I2, O2>(props: { input: (data: I2) => I, output: (data: O) => O2 }) {
  type MessageHandler = (event: ConnectionEventMap<I>['message']) => void
  type TMessageHandler = (event: ConnectionEventMap<I2>['message']) => void
  const handlers = new Map<MessageHandler, TMessageHandler>()

  return {
    apply(ws: Connection<O2, I2>) {
      return <Connection<O, I | I2>>{
        send: data => ws.send(props.output(data)),
        get readyState() { return ws.readyState },
        addEventListener(type, handler) {
          if (type === 'message') {
            const h: TMessageHandler = (event) => {
              (handler as MessageHandler)({ ...event, data: props.input(event.data) })
            }
            handlers.set(handler as MessageHandler, h)
            ws.addEventListener<'message'>(type, h)
          } else {
            ws.addEventListener(type, handler)
          }
        },
        removeEventListener(type, handler) {
          if (type === 'message') {
            const h: TMessageHandler | undefined = handlers.get(handler as MessageHandler)

            if (!h) return

            ws.removeEventListener<'message'>(type, h)
          } else {
            ws.removeEventListener(type, handler)
          }
        }
      }
    }
  }
}
