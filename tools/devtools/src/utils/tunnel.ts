/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Connection } from './communication'

/**
 * Resend connection events from content to injected script
 */

type ReadonlyConnection = Pick<Connection<''>, 'addEventListener' | 'postMessage' | 'removeEventListener'>

export function connectionTunnelEnter<K extends string>(key: K, connection: ReadonlyConnection) {
  connection.addEventListener('open', () => {
    window.dispatchEvent(new MessageEvent(key + 'End', { data: { open: true } }))
  })
  connection.addEventListener('message', ({ data: message }) => {
    window.dispatchEvent(new MessageEvent(key + 'End', { data: { message } }))
  })
  connection.addEventListener('close', () => {
    window.dispatchEvent(new MessageEvent(key + 'End', { data: { close: true } }))
  })
  window.addEventListener(key + 'Start' as any, (event: MessageEvent<unknown>)  => {
    connection.postMessage(event.data)
  })
}

export function connectionTunnelExit<K extends string>(key: K): ReadonlyConnection {
  const eventEmitter = new EventTarget()

  window.addEventListener(key + 'End' as any, (e: MessageEvent<any>) => {
    if ('open' in e.data) eventEmitter.dispatchEvent(new Event('open'))
    if ('message' in e.data) eventEmitter.dispatchEvent(new MessageEvent('message', { data: e.data.message }))
    if ('close' in e.data) eventEmitter.dispatchEvent(new Event('close'))
  })

  return {
    addEventListener(event: string, handler: any) {
      eventEmitter.addEventListener(event, handler)
    },
    removeEventListener(event: string, handler: any) {
      eventEmitter.removeEventListener(event, handler)
    },
    postMessage(message: any) {
      window.dispatchEvent(new MessageEvent(key + 'Start', { data: message }))
    }
  }
}
