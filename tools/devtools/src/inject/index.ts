import { easyhardRequester } from 'easyhard-post-message'
// import { emissionTracker } from './emission-tracker'
import { createHighlighter } from './highlighter'
import { EhNode, EhSubscriber, Parent } from '../dom-types'
import { findElementByDebugId, traverseSubtree } from '../utils/dom'
import { DomToGraph } from './dom-to-graph'
import { createInspector } from './inspector'
import { stringify } from './stringify'
import { filter, map, pluck } from 'rxjs/operators'
import { ConnectionTunnelKey, Graph, GraphPayload, ObservableEmission, ServicesScheme, SubsPayload } from '../types'
import { connectionTunnelExit } from '../utils/tunnel'
import { merge, ReplaySubject, Subscription, tap } from 'rxjs'
import { useEffects } from '../utils/effects'
import './register-window-utils'
import { SubscribersTracker } from './subscribers-tracker'

const connection = connectionTunnelExit<ConnectionTunnelKey>('connectionTunnel')
const requester = easyhardRequester<ServicesScheme>(connection)

const graph = new ReplaySubject<GraphPayload>()
graph.next({ clear: true })

const highlighter = createHighlighter()
// const server = serverToGraph()
// const emissions = emissionTracker()

const subscribers = new Map<string, any>()
const subscriptions = new ReplaySubject<SubsPayload>()
const valuesCache = new Map<string, any>()
const values = new ReplaySubject<ObservableEmission>()
function getValue(valueId: string) {
  return valuesCache.get(valueId)
}
const bridgeSubs = new Map<EhSubscriber, Subscription>()

function added(sub: EhSubscriber, props?: any) {
  if (!sub.__debug?.observable) return
  const data: Graph = { nodes: [], edges: [] }
  const source: string = sub.__debug.observable.__debug.id

  if (!sub.destination) return
  if (!sub.destination.__debug) throw new Error('should have __debug')

  const target = sub.destination?.__debug?.observable ? sub.destination.__debug.observable.__debug.id :  sub.destination.__debug.id

  data.nodes.push({ id: source, scope: sub.__debug.observable.__debug.scope, label: sub.__debug.observable.__debug.name || 'Observable', type: 'observable' })
  if (sub.destination?.__debug?.observable) {
    data.nodes.push({ id: sub.destination.__debug.observable.__debug.id, scope: sub.__debug.observable.__debug.scope, label: 'Observable', type: 'observable' })
  } else {
    data.nodes.push({ id: target, placeholder: true })
  }

  data.edges.push({ id: [source, target].join('_'), source, target, type: props?.type || 'other', label: props?.label })

  graph.next({ added: data })
  subscribers.set(source, [...(subscribers.get(source) || []), sub])
  subscriptions.next({ subscribe: { id: source, count: subscribers.get(source).length }})

  if (sub.__debug.bridge) {
    bridgeSubs.set(sub, sub.__debug.bridge.subscribe((v:
    { added: true, subscriber: EhSubscriber }
    | { removed: true, subscriber: EhSubscriber }
    | { next: true, subscriber: EhSubscriber, value: any }
      /* TODO sanitized */
    ) => {
      if ('added' in v) {
        added(v.subscriber)
      } else if ('removed' in v) {
        removed(v.subscriber)
      } else if ('next' in v) {
        next(v.subscriber, v.value)
      }
    }))
  }
}
function removed(sub: EhSubscriber) {
  if (!sub.__debug?.observable) throw new Error('doesnt have observable')
  const source: string = sub.__debug.observable.__debug.id

  subscribers.set(source, (subscribers.get(source) || []).filter((s: any) => s !== sub))
  const count = subscribers.get(source).length

  if (count) {
    subscriptions.next({ subscribe: { id: source, count }})
  } else {
    graph.next({ removed: [source] })
  }
  if (sub.__debug.bridge) {
    bridgeSubs.get(sub)?.unsubscribe()
  }
}
function next(sub: EhSubscriber, { value, valueId, time }: any) {
  if (!sub.__debug?.observable) throw new Error('doesnt have observable')
  const id = sub.__debug.observable.__debug.id

  values.next({
    id,
    valueId,
    time,
    subscriberId: sub.__debug.id,
    sourceSubscriberIds: (sub.__debug as unknown as { sourcesId: string[] }).sourcesId || sub.__debug.sources.snapshot().map((s: any) => s.__debug.id)
  })
  valuesCache.set(valueId as string, value)
}

const subscribersTracker = new SubscribersTracker({
  added,
  removed,
  next
})
const inspector = createInspector(highlighter)

const effects = useEffects()

effects.add(graph.pipe(
  requester.pipe('graph')
))

effects.add(merge(/*emissions.subscriptions, server.subscriptions, */subscriptions).pipe(
  requester.pipe('subscriptions')
))

effects.add(merge(/*emissions.values, server.values, */values).pipe(
  map(next => ({ next })),
  requester.pipe('emission')
))

effects.add(requester.call('requestEmissionValue').pipe(
  map(data => {
    const { valueId, id, source } = data
    const { value, type } = stringify(getValue(valueId)) //emissions.get(valueId))

    return { id, valueId, value, type, source }
  }),
  requester.pipe('emissionValue')
))

effects.add(requester.call('logEmission').pipe(
  pluck('valueId'),
  map(getValue),//emissions.get),
  tap(console.log)
))

effects.add(inspector.over.pipe(
  map(element => element.__easyhard?.id),
  filter(Boolean),
  map(id => ({ id })),
  requester.pipe('focus')
))

effects.add(inspector.active.pipe(
  requester.pipe('inspector'),
  tap(data => {
    if (data && 'active' in data) {
      if (data.active) {
        inspector.start()
      } else {
        inspector.stop()
      }
      return
    }
    highlighter.hide()

    const el = data && findElementByDebugId(document.body, data.id)
    if (el) highlighter.highlight(el)
  })
))

// effects.add(server.added.pipe(
//   tap(added => graph.next({ added }))
// ))




const domToGraph = new DomToGraph({
  add: (arg, props) => {
    if ('__debug' in arg) {
      subscribersTracker.add(arg, props)
      // emissions.add(arg)
      // server.add(arg)
    }
  }
})

domToGraph.add(document.body)
graph.next({ added: domToGraph.serialize() })

const m = new MutationObserver(mutationsList => {
  mutationsList.forEach(item => {
    if (item.type === 'childList') {
      const domToGraph = new DomToGraph({
        add: (arg, props) => {
          if ('__debug' in arg) {
            subscribersTracker.add(arg, props)

            // emissions.add(arg)
            // server.add(arg)
          }
        }
      })
      item.addedNodes.forEach(node => domToGraph.add(node))

      if (!domToGraph.isEmpty()) {
        graph.next({ added: domToGraph.serialize() })
      }

      const removedNodes: EhNode[] = Array.from(item.removedNodes).map(traverseSubtree).flat()
      const removedNodesIds = removedNodes.map((removed: EhNode) => {
        return removed.__easyhard?.id
      }).filter((id): id is string => Boolean(id))
      const removedNodesParents = removedNodes.map(n => (n.__easyhard?.parent || [])).flat() as Parent[]

      if (removedNodesIds.length > 0) {
        graph.next({ removed: removedNodesIds })

        removedNodesParents
          .filter(p => 'unsubscribe' in p.link)
          .forEach(p => subscribersTracker.remove(p.link as EhSubscriber))
      }
    } else if (item.type === 'characterData') {
      const target: EhNode = item.target
      const meta = target.__easyhard

      if (!meta) throw new Error('should have __easyhard property')
      graph.next({ text: { id: meta.id, value: target.textContent || '' }})
    }
  })
})

m.observe(document.body, {
  characterData: true,
  attributes: true,
  childList: true,
  subtree: true,
})
