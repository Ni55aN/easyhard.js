type ToMessage<ID, T> = { to: ID, message: T }
type ServicesID<Services> = Exclude<keyof Services, symbol | number>
type PortID<Services> = `${ServicesID<Services>}-${number}` | ServicesID<Services>

class PortIdSerializer {
  static delimiter = '|'

  static stringify<S>(name: string | number | symbol, tabId?: number) {
    return [name, tabId].filter(Boolean).join(this.delimiter) as PortID<S>
  }

  static parse<S>(portName: PortID<S>): { name: ServicesID<S>, tabId: number | undefined } {
    const [name, tabId] = portName.split(this.delimiter)

    return {
      name: name as ServicesID<S>,
      tabId: tabId ? +tabId : undefined
    }
  }
}

export class Hub<Services extends {[key: string]: unknown}> {
  ports: {[key in PortID<Services>]?: chrome.runtime.Port}

  constructor(private accept: (keyof Services)[]) {
    this.ports = {}
  }

  listen<To extends ServicesID<Services>>(onMessage: (payload: { from: ServicesID<Services>, to: To, message: Services[To] }) => void) {
    chrome.runtime.onConnect.addListener(port => {
      const { name, tabId: connectionTabId } = PortIdSerializer.parse<Services>(port.name as PortID<Services>)
      const tabId = connectionTabId || port.sender?.tab?.id  as number

      if (!tabId) return
      if (!this.accept.includes(name)) return
      console.debug('connected ', name)
      this.setPort(name, tabId, port)

      port.onMessage.addListener((payload: ToMessage<To, Services[To]>) => {
        onMessage({ from: name, to: payload.to, message: payload.message })
        try {
          this.getPort(payload.to, tabId).postMessage(payload.message)
        } catch (error: Error | any) {
          console.warn(error)
          this.getPort(name, tabId).postMessage({ error: 'message' in error ? error.message : error })
        }
      })

      port.onDisconnect.addListener(() => {
        console.debug('disconnected ', name)
        this.setPort(name, tabId, undefined)
      })
    })
  }

  private setPort(name: ServicesID<Services>, tabId: number, port: chrome.runtime.Port | undefined) {
    this.ports[PortIdSerializer.stringify<Services>(name, tabId)] = port
  }

  private getPort(name: ServicesID<Services>, tabId: number): chrome.runtime.Port {
    const port = this.ports[PortIdSerializer.stringify<Services>(name, tabId)]

    if (!port) throw new Error('port hasnt connected')

    return port
  }
}

export class Connection<Services extends {[key: string]: unknown}, Key extends keyof Services> {
  private port: chrome.runtime.Port
  private buffer: { to: keyof Services, message: Services[keyof Services] }[] = []

  // tabId needs to be defined in sender is undefined (e.g. from devtools panel)
  constructor(private name: Key, private tabId?: number) {
    this.port = this.connect(name, tabId)

    this.flush()
  }

  private reconnect() {
    console.log(`reconnect ${String(this.name)} for tab ${this.tabId || 'unknown'}`)
    this.port = this.connect(this.name, this.tabId)
  }

  private connect(name: Key, tabId?: number) {
    return chrome.runtime.connect({ name: PortIdSerializer.stringify<Services>(name, tabId) })
  }

  private flush() {
    while (this.buffer.length) {
      try {
        this.port.postMessage(this.buffer[0])
        this.buffer.shift()
      } catch(e) {
        console.error(e)
        this.reconnect()
      }
    }
    requestAnimationFrame(() => this.flush())
  }

  addListener(handler: (message: Services[Key]) => void) {
    this.port.onMessage.addListener(handler)
  }

  postMessage<ID extends keyof Services>(to: ID, message: Services[ID]) {
    this.buffer.push({ to, message })
  }
}
