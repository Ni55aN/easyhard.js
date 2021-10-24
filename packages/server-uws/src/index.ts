import { WebSocketState } from 'easyhard-bridge'
import { attach, Attachment, Handlers } from 'easyhard-server'
import { WebSocketBehavior, WebSocket as uWS, HttpRequest } from 'uWebSockets.js'
import { ConnectionAdapter } from './connection-adapter'
import { HttpTunnel, useHttp } from './http'
import { arrayBufferToString } from './utils'

type Request = HttpRequest & { socket: { ip: string }}
type UpgradeData = { req: Request }
type WebSocket = uWS & UpgradeData & { adapter: ConnectionAdapter }
type Props = { open: (ws: uWS, attachment: Attachment) => void }

export function easyhardServer<T>(actions: Handlers<T, Request>): { attachClient: (props: Props) => WebSocketBehavior, httpTunnel: HttpTunnel } {
  const http = useHttp()

  function attachClient(props: Props): WebSocketBehavior {
    return {
      upgrade(res, req, context) {
        res.upgrade<UpgradeData>(
          { req: {
            ...req,
            socket: { ip: arrayBufferToString(res.getRemoteAddressAsText()) }
          }},
          req.getHeader('sec-websocket-key'),
          req.getHeader('sec-websocket-protocol'),
          req.getHeader('sec-websocket-extensions'),
          context
        )
      },
      open(uws) {
        const ws = uws as WebSocket
        const { req } = ws

        ws.adapter = new ConnectionAdapter(ws)
        ws.adapter.readyState = WebSocketState.OPEN

        const attachment = attach(actions, ws.adapter, req, http)

        props.open(ws, attachment)
      },
      message(uws, message) {
        const ws = uws as WebSocket
        const data = arrayBufferToString(message)

        ws.adapter.emit('message', { data })
      },
      close(uws, code, message) {
        const ws = uws as WebSocket

        ws.adapter.readyState = WebSocketState.CLOSED
        ws.adapter.emit('close', { code, reson: message, wasClean: true })
      }
    }
  }

  return {
    attachClient,
    httpTunnel: http.tunnel
  }
}
