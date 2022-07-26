import { easyhardRequester } from 'easyhard-post-message'
import { emissionTracker } from './emission-tracker'
import { createHighlighter } from './highlighter'
import { EhNode } from '../dom-types'
import { findElementByDebugId, traverseSubtree } from '../utils/dom'
import { DomToGraph } from './dom-to-graph'
import { createInspector } from './inspector'
import { stringify } from './stringify'
import { filter, map, pluck } from 'rxjs/operators'
import { ConnectionTunnelKey, GraphPayload, ServicesScheme } from '../types'
import { connectionTunnelExit } from '../utils/tunnel'
import { ReplaySubject, tap } from 'rxjs'
import { useEffects } from '../utils/effects'
import './register-window-utils'

const connection = connectionTunnelExit<ConnectionTunnelKey>('connectionTunnel')
const requester = easyhardRequester<ServicesScheme>(connection)

const graph = new ReplaySubject<GraphPayload>()

const highlighter = createHighlighter()
const emissions = emissionTracker()
const inspector = createInspector(highlighter)

const effects = useEffects()

effects.add(graph.pipe(
  requester.pipe('graph')
))

effects.add(emissions.subscriptions.pipe(
  requester.pipe('subscriptions')
))

effects.add(emissions.values.pipe(
  map(next => ({ next })),
  requester.pipe('emission')
))

effects.add(requester.call('requestEmissionValue').pipe(
  map(data => {
    const { valueId, id, source } = data
    const { value, type } = stringify(emissions.get(valueId))

    return { id, valueId, value, type, source }
  }),
  requester.pipe('emissionValue')
))

effects.add(requester.call('logEmission').pipe(
  pluck('valueId'),
  map(emissions.get),
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

const domToGraph = new DomToGraph({
  add: arg => '__debug' in arg && emissions.add(arg)
})

domToGraph.add(document.body)
graph.next({ graph: domToGraph.serialize() })

const m = new MutationObserver(mutationsList => {
  mutationsList.forEach(item => {
    if (item.type === 'childList') {
      const domToGraph = new DomToGraph({
        add: arg => '__debug' in arg && emissions.add(arg)
      })

      item.addedNodes.forEach(node => domToGraph.add(node))

      if (!domToGraph.isEmpty()) {
        graph.next({ added: domToGraph.serialize() })
      }

      const removedNodes = Array.from(item.removedNodes).map(traverseSubtree).flat()
      const removedNodesIds = removedNodes.map((removed: EhNode) => {
        return removed.__easyhard?.id
      }).filter((id): id is string => Boolean(id))

      if (removedNodesIds.length > 0) {
        graph.next({ removed: removedNodesIds })

        removedNodesIds.forEach(emissions.remove)
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
