type ToMessage<ID, T> = { to: ID, message: T }

export class Hub<ID extends string> {
  ports: {[key in ID]?: chrome.runtime.Port}

  constructor(private accept: ID[]) {
    this.ports = {}
  }

  listen(onMessage: <T>(payload: { from: ID, to: ID, message: T }) => void) {
    chrome.runtime.onConnect.addListener(port => {
      const name = port.name as ID
      if (!this.accept.includes(name)) return
      console.log('connected ', name)
      this.ports[name] = port

      port.onMessage.addListener((payload: ToMessage<ID, any>) => {
        onMessage({ from: name, to: payload.to, message: payload.message })
        this.getPort(payload.to).postMessage(payload.message)
      })
    })
  }

  private getPort(id: ID): chrome.runtime.Port {
    const port = this.ports[id]

    if (!port) throw new Error('port hasnt connected')

    return port
  }
}

export class Connection<ID extends string> {
  private port: chrome.runtime.Port

  constructor(name: ID) {
    this.port = chrome.runtime.connect({ name })
  }

  addListener<T>(handler: (message: T) => void) {
    this.port.onMessage.addListener(handler)
  }

  postMessage<T>(to: ID, message: T) {
    this.port.postMessage(<ToMessage<ID, T>>{ to, message })
  }
}
