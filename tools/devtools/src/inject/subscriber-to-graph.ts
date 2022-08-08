import { Graph } from '../types'
import { EhSubscriber, JsonSubscriber } from '../dom-types'

export class SubscriberToGraph {
  data: Graph = { nodes: [], edges: [] }

  add(sub: EhSubscriber | JsonSubscriber, props: any) {
    if (!sub.__debug?.observable) return
    const source: string = sub.__debug.observable.__debug.id

    if (!sub.destination) return
    if (!sub.destination.__debug) throw new Error('should have __debug')

    const target = sub.destination?.__debug?.observable ? sub.destination.__debug.observable.__debug.id :  sub.destination.__debug.id

    this.data.nodes.push({
      id: source,
      scope: sub.__debug.observable.__debug.scope, label: sub.__debug.observable.__debug.name || 'Observable',
      type: 'observable',
      internal: sub.__debug.observable.__debug.internal
    })
    if (sub.destination?.__debug?.observable) {
      this.data.nodes.push({
        id: sub.destination.__debug.observable.__debug.id,
        scope: sub.__debug.observable.__debug.scope,
        label: 'Observable',
        type: 'observable'
      })
    } else {
      this.data.nodes.push({ id: target, placeholder: true })
    }

    this.data.edges.push({ id: [source, target].join('_'), source, target, type: props?.type || 'other', label: props?.label })
  }

  isEmpty() {
    return this.data.edges.length === 0 && this.data.nodes.length === 0
  }

  serialize() {
    return this.data
  }
}
