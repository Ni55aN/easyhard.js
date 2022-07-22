type PortPayload<Services> = { name: Services, to: Services, tabId: number }
type Port<Services> = PortPayload<Services> & { port: chrome.runtime.Port }
type Message = { open: true } | { error: any } | { message: any }

export class Hub<Services extends string> {
  ports: Port<Services>[] = []

  constructor(private accept: (Services)[]) {}

  listen(onMessage: (payload: { from: Services, to: Services, message: unknown }) => void) {
    chrome.runtime.onConnect.addListener(port => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      const { name, to, tabId: connectionTabId } = JSON.parse(port.name) as Port<Services>
      const tabId = connectionTabId || port.sender?.tab?.id  as number

      if (!tabId) return
      if (!this.accept.includes(name)) return
      console.debug('connected ', name)
      this.addPort(name, to, tabId, port)

      port.onMessage.addListener((message: unknown) => {
        onMessage({ from: name, to, message })
        try {
          this.getPort(to, name, tabId).postMessage({ message })
        } catch (error: Error | any) {
          console.warn(error)
          port.postMessage({ error: 'message' in error ? error.message : error })
        }
      })

      port.onDisconnect.addListener(() => {
        console.debug('disconnected ', name)
        this.removePort(name, to, tabId)
      })
    })
  }

  private addPort(name: Services, to: Services, tabId: number, port: chrome.runtime.Port) {
    const current: Port<Services> = {
      name,
      to,
      tabId,
      port
    }
    this.ports.push(current)

    const target = this.ports.find(port => port.to === name && port.name === to && port.tabId === tabId)

    if (target) {
      target.port.postMessage({ open: true })
      current.port.postMessage({ open: true })
    }
  }

  private removePort(name: Services, to: Services, tabId: number) {
    const port = this.ports.find(port => port.name === name &&  port.to === to &&  port.tabId === tabId)

    if (port) {
      const index = this.ports.indexOf(port)
      this.ports.splice(index, 1)
      port.port.disconnect()

      const target = this.ports.find(port => port.to === name && port.name === to && port.tabId === tabId)

      if (target) {
        target.port.disconnect()
        this.removePort(target.name, target.to, target.tabId)
      }
    }
  }

  private getPort<To extends Services>(name: Services, to: To, tabId: number): chrome.runtime.Port {
    const port = this.ports.find(p => p.name === name && p.to === to && p.tabId === tabId)

    if (!port) throw new Error('port hasnt connected')

    return port.port
  }
}


type Handler = (event: { type: string, target: any, data: unknown }) => void
type EventName = 'message' | 'open' | 'close' | 'error'

export class Connection<Services extends string> {
  private port: chrome.runtime.Port
  private handlers: { event: EventName, handler: (e: any) => void }[] = []

  // tabId needs to be defined in sender is undefined (e.g. from devtools panel)
  constructor(private name: Services, private to: Services, private tabId?: number) {
    this.port = this.connect(name, to, tabId)
  }

  private connect(name: Services, to: Services, tabId?: number) {
    const port = chrome.runtime.connect({ name: JSON.stringify(<PortPayload<Services>>{ name, to, tabId }) })

    port.onDisconnect.addListener(() => {
      this.emit('close', new CloseEvent('close', { reason: 'disconnect' }))
      setTimeout(() => this.reconnect(), 500)
    })
    port.onMessage.addListener((message: Message) => {
      if ('open' in message) {
        this.emit('open', undefined)
      }
      if ('error' in message) {
        this.emit('error', message.error)
      }
      if ('message' in message) {
        this.emit('message', new MessageEvent('message', { data: message.message }))
      }
    })

    return port
  }

  private reconnect() {
    console.log(`reconnect ${String(this.name)} for tab ${this.tabId || 'unknown'}`)
    this.port = this.connect(this.name, this.to, this.tabId)
  }

  private emit(event: EventName, data: any) {
    this.handlers.filter(h => h.event === event).forEach(h => h.handler(data))
  }

  addEventListener(event: EventName, handler: Handler) {
    this.handlers.push({ event, handler })
  }

  removeEventListener(event: EventName, handler: Handler) {
    this.handlers = this.handlers.filter(h => !(h.event === event && h.handler === handler))
  }

  postMessage(message: unknown) {
    this.port.postMessage(message)
  }
}

