import { easyhardRequester } from 'easyhard-post-message'
import { filter, map, mergeMap, pluck } from 'rxjs/operators'
import { createHighlighter } from './highlighter'
import { EhNode, EhSubscriber, JsonSubscriber, JsonSubscriberValue, Parent, SubscriberValue } from '../dom-types'
import { useEffects } from '../utils/effects'
import { ConnectionTunnelKey, GraphPayload, ObservableEmissionType, ServicesScheme } from '../types'
import { connectionTunnelExit } from '../utils/tunnel'
import { findElementByDebugId, traverseSubtree } from '../utils/dom'
import { DomToGraph } from './dom-to-graph'
import { createInspector } from './inspector'
import { stringify } from './stringify'
import { SubscribersTracker } from './subscribers-tracker'
import { emissionTracker } from './emission-tracker'
import { merge, ReplaySubject, Subscription, tap } from 'rxjs'
import './register-window-utils'
import { SubscriberToGraph } from './subscriber-to-graph'

const connection = connectionTunnelExit<ConnectionTunnelKey>('connectionTunnel')
const requester = easyhardRequester<ServicesScheme>(connection)

const graph = new ReplaySubject<GraphPayload>()
graph.next({ clear: true })

const highlighter = createHighlighter()
const emissions = emissionTracker()

const bridgeSubs = new Map<string, { sub: EhSubscriber, valuesId: Set<string>, bridgeSub: Subscription }>()

function added(sub: EhSubscriber | JsonSubscriber, props?: any) {
  if (!sub.__debug?.observable) return
  const subscriberToGraph = new SubscriberToGraph()

  subscriberToGraph.add(sub, props)

  if (!subscriberToGraph.isEmpty()) {
    graph.next({ added: subscriberToGraph.serialize() })
  }
  emissions.add(sub)

  if ('bridge' in sub.__debug && sub.__debug.bridge) {
    const valuesId = new Set<string>()
    const bridgeSub = sub.__debug.bridge.subscribe(v => {
      if ('added' in v) {
        added(v.subscriber)
      } else if ('removed' in v) {
        removed(v.subscriber)
      } else if ('next' in v) {
        valuesId.add(v.value.valueId)
        next(v.subscriber, v.value)
      }
    })
    bridgeSubs.set(sub.__debug.id, { sub: sub as EhSubscriber, bridgeSub, valuesId })
  }
}
function removed(sub: EhSubscriber | JsonSubscriber) {
  if (!sub.__debug?.observable) throw new Error('doesnt have observable')
  const source: string = sub.__debug.observable.__debug.id
  const { count } = emissions.remove(sub)

  if (count === 0) {
    graph.next({ removed: [source] })
  }
  if ('bridge' in sub.__debug && sub.__debug.bridge) {
    const bridge = bridgeSubs.get(sub.__debug.id)

    if (bridge) {
      bridge.bridgeSub.unsubscribe()
    }
  }
}
function next(sub: EhSubscriber | JsonSubscriber, props: SubscriberValue | JsonSubscriberValue) {
  emissions.next(sub, props)
}

function findLogSubscriber(valueId: string) {
  const bridge = Array.from(bridgeSubs.values()).find(v => v.valuesId.has(valueId))

  return bridge?.sub?.__debug
}

function logEmission(valueId: string) {
  if (emissions.has(valueId)) {
    console.log('[Easyhard.js log emission]', emissions.get(valueId))
  } else {
    findLogSubscriber(valueId)?.bridgeIn?.next({ logEmission: { valueId } })
  }
}

async function getEmissionValue(valueId: string): Promise<{ value: string, type: ObservableEmissionType }>  {
  if (emissions.has(valueId)) {
    return stringify( emissions.get(valueId))
  } else {
    const sub = findLogSubscriber(valueId)

    if (sub && sub.bridgeIn && sub.bridge) {
      sub.bridgeIn.next({ getEmissionValue: { valueId } })

      return new Promise((res, rej) => {
        const timeout = setTimeout(() => {
          subscription?.unsubscribe()
          rej(new Error('cannot receive emission value'))
        }, 1000)
        const subscription = sub.bridge?.subscribe(v => {
          if (v && 'emissionValue' in v && v.emissionValue.valueId === valueId) {
            clearTimeout(timeout)
            subscription?.unsubscribe()
            res(v.emissionValue)
          }
        })
      })
    }
  }
  return {
    type: 'undefined',
    value: 'undefined'
  }
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

effects.add(merge(emissions.subscriptions).pipe(
  requester.pipe('subscriptions')
))

effects.add(merge(emissions.values).pipe(
  map(next => ({ next })),
  requester.pipe('emission')
))

effects.add(requester.call('requestEmissionValue').pipe(
  mergeMap(async data => {
    const { valueId, id, source } = data
    try {
      const { value, type } = await getEmissionValue(valueId)

      return { id, valueId, value, type, source }
    } catch {
      return null
    }
  }),
  filter((n): n is Exclude<typeof n, null> => n !== null),
  requester.pipe('emissionValue')
))

effects.add(requester.call('logEmission').pipe(
  pluck('valueId'),
  tap(logEmission)
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
