import { RequestId } from 'easyhard-common'

type Props<T> = {
  onSet: (item: T, id: string) => void
  onRemove: (item: T, id: string) => void
}

/* eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types */
export function useSubscriptions<T>(props: Props<T>) {
  const subscriptions: {[key in RequestId]: T} = {}

  function get(id: RequestId) {
    return subscriptions[id]
  }

  function set(id: RequestId, item: T) {
    props.onSet(item, id)
    subscriptions[id] = item
  }

  function remove(id: RequestId) {
    props.onRemove(subscriptions[id], id)
    delete subscriptions[id]
  }

  function refresh() {
    Object.entries(subscriptions).forEach(([id, item]) => props.onSet(item, id))
  }

  return {
    get,
    set,
    remove,
    refresh
  }
}
