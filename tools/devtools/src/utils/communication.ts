type ToMessage<ID, T> = { to: ID, message: T }

export class Hub<Services extends {[key: string]: unknown}> {
  ports: {[key in keyof Services]?: chrome.runtime.Port}

  constructor(private accept: (keyof Services)[]) {
    this.ports = {}
  }

  listen<F extends keyof Services, To extends keyof Services>(onMessage: (payload: { from: F, to: To, message: Services[To] }) => void) {
    chrome.runtime.onConnect.addListener(port => {
      const name = port.name as F
      if (!this.accept.includes(name)) return
      console.debug('connected ', name)
      this.ports[name] = port

      port.onMessage.addListener((payload: ToMessage<To, Services[To]>) => {
        onMessage({ from: name, to: payload.to, message: payload.message })
        try {
          this.getPort(payload.to).postMessage(payload.message)
        } catch (error: Error | any) {
          console.warn(error)
          this.getPort(name).postMessage({ error: 'message' in error ? error.message : error })
        }
      })

      port.onDisconnect.addListener(() => {
        console.debug('disconnected ', name)
        this.ports[name] = undefined
      })
    })
  }

  private getPort(id: keyof Services): chrome.runtime.Port {
    const port = this.ports[id]

    if (!port) throw new Error('port hasnt connected')

    return port
  }
}

export class Connection<Services extends {[key: string]: unknown}, Key extends keyof Services> {
  private port: chrome.runtime.Port

  constructor(name: Key) {
    this.port = chrome.runtime.connect({ name: name as string })
  }

  addListener(handler: (message: Services[Key]) => void) {
    this.port.onMessage.addListener(handler)
  }

  postMessage<ID extends keyof Services>(to: ID, message: Services[ID]) {
    this.port.postMessage(<ToMessage<ID, Services[ID]>>{ to, message })
  }
}
