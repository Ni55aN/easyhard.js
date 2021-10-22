import { WebSocketState, WsConnection } from 'easyhard-bridge'
import { getUID } from 'easyhard-common'
import { attach, Attachment, BodyListeners, CookieSetters, Handlers, Http, ReqListeners } from 'easyhard-server'
import { WebSocketBehavior, WebSocket, HttpResponse, HttpRequest } from 'uWebSockets.js'
import { TextDecoder } from 'util'

type HttpTunnel = (res: HttpResponse, req: HttpRequest) => void

const decoder = new TextDecoder('utf-8')

function arrayBufferToString(data: ArrayBuffer) {
    return decoder.decode(new Uint8Array(data))
}

export function useHttp(): Http & { tunnel: HttpTunnel } {
    const reqListeners: ReqListeners = new Map()
    const bodyListeners: BodyListeners = new Map()
    const cookieSetters: CookieSetters = new Map()

    function tunnel(res: HttpResponse, req: HttpRequest) {
    }

    return {
        bodyListeners,
        reqListeners,
        cookieSetters,
        tunnel
    }
}

type Request = HttpRequest & { socket: { ip: string }}
type Props = { open: (ws: WebSocket, attachment: Attachment) => void }

export function easyhardServer<T>(actions: Handlers<T, Request>): { attachClient: (props: Props) => WebSocketBehavior, httpTunnel: HttpTunnel } {
    const http = useHttp()
    type Connection = WsConnection & { listeners: [string, (...args: any[]) => any][], emit: <T>(event: string, payload: T) => void }
    const connections = new Map<string, Connection>()

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
                const listeners: Connection['listeners'] = []
                const connection: Connection = {
                    listeners,
                    emit(event, payload) {
                        listeners
                            .filter(e => e[0] === event)
                            .forEach(e => e[1](payload))
                    },
                    addEventListener(event, handler) {
                        listeners.push([event, handler])
                    },
                    removeEventListener(event, handler) {
                        const listenersToRemove = [...listeners].filter(e => e[0] === event && e[1] === handler)

                        listenersToRemove.forEach(item => {
                            const index = listeners.indexOf(item)

                            if (index >= 0) listeners.splice(index, 1)
                        })
                    },
                    readyState: WebSocketState.OPEN,
                    send(data) {
                        ws.send(data)
                    }
                }
                const attachment = attach(actions, connection, req, http)

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
