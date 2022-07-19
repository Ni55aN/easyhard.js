import { ConnectionState } from 'easyhard-bridge'
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
        const ws = uws
        const { req } = ws

        ws.adapter = new ConnectionAdapter(ws)
        ws.adapter.readyState = ConnectionState.OPEN

        const attachment = attach(actions, ws.adapter, req, http)

        props.open(ws, attachment)
      },
      message(uws, message) {
        const ws = uws as WebSocket
        const data = JSON.parse(arrayBufferToString(message))

        ws.adapter.emit('message', { data, type: '', target: null })
      },
      close(uws, code, message) {
        const ws = uws as WebSocket
        const reason = arrayBufferToString(message)

        ws.adapter.readyState = ConnectionState.CLOSED
        ws.adapter.emit('close', { code, reason, wasClean: true } as CloseEvent)
      }
    }
  }

  return {
    attachClient,
    httpTunnel: http.tunnel
  }
}
