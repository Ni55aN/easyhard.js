import { RequestId } from 'easyhard-common'
import { Subscription } from 'rxjs'

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function useSubscriptions() {
  const subscriptions: {[key: string]: Subscription } = {}

  function add(id: RequestId, subscription: Subscription) {
    subscriptions[id] = subscription
  }
  function remove(id: RequestId) {
    subscriptions[id].unsubscribe()
    delete subscriptions[id]
  }
  function clear() {
    Object.keys(subscriptions).forEach(remove)
  }
  return {
    add,
    remove,
    clear
  }
}
