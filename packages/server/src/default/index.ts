import { connectionSerializer, Connection, ClientToServer, Key, ServerToClient } from 'easyhard-bridge'
import { attach } from '..'
import { Attachment, Handlers } from '../types'
import { HttpTunnel, Request, useHttp } from './http'

type Input = string | Buffer | ArrayBuffer | Buffer[]
type Output = string | ArrayBufferLike | Blob | ArrayBufferView

export function easyhardServer<T>(actions: Handlers<T, Request>): { attachClient: (connection: Connection<Output, Input>, request: Request) => Attachment, httpTunnel: HttpTunnel } {
  const http = useHttp()
  const serializer = connectionSerializer<ServerToClient<unknown>, ClientToServer<Key>, string, string>({ input: data => JSON.parse(String(data)), output: data => JSON.stringify(data) })

  function attachClient(ws: Connection<Output, Input>, req: Request) {
    return attach(actions, serializer.apply(ws), req, http)
  }

  return {
    attachClient,
    httpTunnel: http.tunnel
  }
}

