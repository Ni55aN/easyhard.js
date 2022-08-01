import { ReplaySubject, Subscription } from 'rxjs'
import { EdgeType, Graph, ObservableEmission, SubsPayload } from '../types'
import { EhObservable, Parent } from '../dom-types'

export function serverToGraph() {
  const trackedSubscriptions = new Map<string, Subscription>()
  const added = new ReplaySubject<Graph>()
  const subscriptions = new ReplaySubject<SubsPayload>()
  const values = new ReplaySubject<ObservableEmission>()

  function add(ob: EhObservable) {
    const { __debug } = ob
    const { id, bridge } = __debug

    if (!bridge) return
    if (trackedSubscriptions.has(id)) return

    const subscription = new Subscription()

    subscription.add(bridge.subscribe(args => {
      if ('name' in args) {
        added.next({
          nodes: [
            {
              id: args.id,
              label: args.name,
              type: 'observable',
              scope: 'server'
            }
          ],
          edges: []
        })
        setTimeout(() => { // HOTFIX add edges for future nodes
          added.next({
            nodes: [],
            edges: args.parents.map(p => ({
              id: [p.id, args.id].join('_'),
              source: p.id,
              target: args.id,
              type: p.type
            }))
          })
          if (args.isEntry) {
            added.next({
              nodes: [],
              edges: [
                {
                  id: [args.id, id].join('_'),
                  source: args.id,
                  target: id,
                  type: 'argument'
                }
              ]
            })
          }
          if (args.name === 'call') {
            const parents = ob.__debug.parent.flat() as Parent[]

            added.next({
              nodes: [],
              edges: parents
                .map(p => '__debug' in p.link ? p.link.__debug.id : p.link.__easyhard?.id)
                .filter((id): id is string => Boolean(id))
                .map(id => {
                  return {
                    id: [id, args.id].join('_'),
                    source: id,
                    target: args.id,
                    type: 'argument' as EdgeType
                  }
                })
            })
          }
        }, 200)
      } else if ('subscribe' in args) {
        subscriptions.next({ subscribe: args })
      } else if ('unsubscribe' in args) {
        subscriptions.next({ unsubscribe: args })
      } else if ('valueId' in args) {
        values.next(args)
      }
    }))
    trackedSubscriptions.set(id, subscription)
  }
  function remove(id: string) {
    trackedSubscriptions.get(id)?.unsubscribe()
    trackedSubscriptions.delete(id)
  }

  return {
    added,
    subscriptions,
    values,
    add,
    remove,
  }
}
