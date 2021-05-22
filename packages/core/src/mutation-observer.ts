import { getNested } from './utils'

const observers = new WeakMap<Node, { added: () => void; removed: () => void }[]>()
const status = { connected: false }

const observer = new MutationObserver((mutationsList: MutationRecord[]) => {
  for(const record of mutationsList) {
    for (const addedNode of getNested(record.addedNodes)) {
      const subscription = observers.get(addedNode)

      if (subscription) {
        subscription.forEach(s => s.added())
      }
    }
    for (const removedNode of getNested(record.removedNodes)) {
      const subscription = observers.get(removedNode)

      if (subscription) {
        subscription.forEach(s => s.removed())
        observers.delete(removedNode)
      }
    }
  }
})

export function disconnectObserver(): void {
  observer.disconnect()
  status.connected = false
}

export function connectObserver(container = document.body): void {
  disconnectObserver()
  observer.observe(container, { childList: true, subtree: true })
  status.connected = true
}
export function observeElement(el: Node, props: { added: () => void; removed: () => void }): void {
  if (!status.connected) { connectObserver() }

  const list = observers.get(el)

  if (list) {
    list.push(props)
  } else {
    observers.set(el, [props])
  }
}