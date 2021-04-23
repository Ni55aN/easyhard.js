import { RequestId } from 'easyhard-common'

/* eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types */
export function useSubscriptions<T>() {
  const subscriptions: {[key in RequestId]: T} = {}

  function get(id: RequestId) {
    return subscriptions[id]
  }

  function add(id: RequestId, item: T) {
    subscriptions[id] = item
  }

  function remove(id: RequestId) {
    delete subscriptions[id]
  }

  return {
    get,
    list: () => Object.values(subscriptions),
    add,
    remove
  }
}
