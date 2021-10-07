import { WsConnection } from 'easyhard-bridge'
import { attach } from '..'
import { Attachment, Handlers } from '../types'
import { HttpTunnel, Request, useHttp } from './http'

export function easyhardServer<T>(actions: Handlers<T, Request>): { attachClient: (connection: WsConnection, request: Request) => Attachment, httpTunnel: HttpTunnel } {
  const http = useHttp()

  function attachClient(ws: WsConnection, req: Request) {
    return attach(actions, ws, req, http)
  }

  return {
    attachClient,
    httpTunnel: http.tunnel
  }
}
