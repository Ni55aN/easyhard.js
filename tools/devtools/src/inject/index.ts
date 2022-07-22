/* eslint-disable @typescript-eslint/no-unused-vars */
import { easyhardRequester } from 'easyhard-post-message'
import { emissionTracker } from './emission-tracker'
import { createHighlighter } from './highlighter'
import { EhNode } from './types'
import { findElementByDebugId, traverseSubtree } from './dom'
import { DomToGraph } from './dom-to-graph'
import { createInspector } from './inspector'
import { stringify } from './stringify'
import { map, retry } from 'rxjs/operators'
import { ConnectionTunnelKey, GraphPayload, ObservableEmission, SubsPayload, _Services } from '../types'
import { connectionTunnelExit } from '../utils/tunnel'
import { BehaviorSubject, ReplaySubject, Subject } from 'rxjs'

const connection = connectionTunnelExit<ConnectionTunnelKey>('connectionTunnel')
const requester = easyhardRequester<_Services>(connection)

const graph = new ReplaySubject<GraphPayload>()
const subscriptions = new ReplaySubject<SubsPayload>()
const emission = new ReplaySubject<ObservableEmission>()
const focus = new Subject<{ id: string }>()
const inspecting = new BehaviorSubject(false)

const highlighter = createHighlighter()
const emissions = emissionTracker(
  data => emission.next(data),
  data => subscriptions.next({ subscribe: data }),
  data => subscriptions.next({ unsubscribe: data })
)
const inspector = createInspector(highlighter, element => {
  const id = element.__easyhard?.id

  if (id) {
    focus.next({ id })
  }
}, () => {
  inspecting.next(false)
})


graph.pipe(requester.pipe('graph'), retry()).subscribe()

subscriptions.pipe(requester.pipe('subscriptions'), retry()).subscribe()

emission.pipe(map(next => ({ next })), requester.pipe('emission'), retry()).subscribe()

requester.call('requestEmissionValue').pipe(map(data => {
  const { valueId, id, source } = data
  const { value, type } = stringify(emissions.get(valueId))

  return { id, valueId, value, type, source }
}), requester.pipe('emissionValue'), retry()).subscribe()

requester.call('logEmission').pipe(retry()).subscribe(data => {
  const { valueId } = data

  console.log(emissions.get(valueId))
})

focus.pipe(requester.pipe('focus'), retry()).subscribe()

inspecting.pipe(requester.pipe('inspector'), retry()).subscribe(data => {
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

  emissions.flush()
})

m.observe(document.body, {
  characterData: true,
  attributes: true,
  childList: true,
  subtree: true,
})
