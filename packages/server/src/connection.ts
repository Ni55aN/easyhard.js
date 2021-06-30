import * as ws from 'ws'

type Props<In> = {
  onMessage: (data: In) => void
  onClose: () => void
}

export function useConnection<In, Out>(ws: ws, props: Props<In>): { send: (data: Out) => void} {
  ws.on('message', data => {
    const request: In = JSON.parse(data.toString('utf-8'))

    props.onMessage(request)
  })

  return {
    send(data: Out) {
      if (ws.readyState === ws.OPEN) {
        ws.send(JSON.stringify(data))
        return true
      }
    }
  }
}
