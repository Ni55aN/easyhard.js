import { Services } from '../types'


export function send(message: Services['easyhard-devtools']) {
  window.postMessage(message)
}

export function onMessage(handler: (data: Services['easyhard-content']) => void) {
  window.addEventListener('message', ({ data }: { data: Services['easyhard-content'] }) => handler(data))
}
