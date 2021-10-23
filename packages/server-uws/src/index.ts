import { WebSocketState } from 'easyhard-bridge'
import { getUID } from 'easyhard-common'
import { attach, Attachment, Handlers } from 'easyhard-server'
import { WebSocketBehavior, WebSocket, HttpRequest } from 'uWebSockets.js'
import { ConnectionAdapter } from './connection-adapter'
import { HttpTunnel, useHttp } from './http'
import { arrayBufferToString } from './utils'

type Request = HttpRequest & { socket: { ip: string }}
type Props = { open: (ws: WebSocket, attachment: Attachment) => void }

export function easyhardServer<T>(actions: Handlers<T, Request>): { attachClient: (props: Props) => WebSocketBehavior, httpTunnel: HttpTunnel } {
    const http = useHttp()
    const connections = new Map<string, ConnectionAdapter>()

    function attachClient(props: Props): WebSocketBehavior {
        return {
            upgrade(res, req, context) {
                const id = getUID()

                res.upgrade(
                    { id, req: <Request>{
                        ...req,
                        socket: { ip: arrayBufferToString(res.getRemoteAddressAsText()) }
                    }},
                    req.getHeader('sec-websocket-key'),
                    req.getHeader('sec-websocket-protocol'),
                    req.getHeader('sec-websocket-extensions'),
                    context
                )
            },
            open: (ws: WebSocket) => {
                const { id, req } = ws
                const connection = new ConnectionAdapter(ws)
                const attachment = attach(actions, connection, req, http)

                connection.readyState = WebSocketState.OPEN
                connections.set(id, connection)
                props.open(ws, attachment)
            },
            message: (ws, message) => {
                const id: string = ws.id
                const connection = connections.get(id)
                const data = arrayBufferToString(message)

                connection?.emit('message', { data })
            },
            close: (ws, code, message) => {
                const id: string = ws.id
                const connection = connections.get(id)
                if (connection) connection.readyState = WebSocketState.CLOSED

                connection?.emit('close', { code, reson: message, wasClean: true })
                connections.delete(id)
            }
        }
    }

    return {
        attachClient,
        httpTunnel: http.tunnel
    }
}
