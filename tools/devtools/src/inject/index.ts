import { emissionTracker } from './emission-tracker'
import { createHighlighter } from './highlighter'
import { EhNode } from './types'
import * as connection from './connection'
import { findElementByDebugId, traverseSubtree } from './dom'
import { DomToGraph } from './dom-to-graph'
import { createInspector } from './inspector'

const highlighter = createHighlighter()
const emissions = emissionTracker(data => connection.send({ type: 'NEXT', data }))
const inspector = createInspector(highlighter, element => {
  const id = element.__easyhard?.id

  if (id) {
    connection.send({ type: 'FOCUS', data: { id }})
  }
})

connection.onMessage(data => {
  if (data.type === 'GET_GRAPH') {
    const domToGraph = new DomToGraph({
      add: arg => '__debug' in arg && emissions.add(arg)
    })

    domToGraph.add(document.body)

    connection.send({ type: 'GRAPH', data: domToGraph.serialize() })
    emissions.flush()
  }
  if (data.type === 'INSPECT') {
    highlighter.hide()

    const el = data.data && findElementByDebugId(document.body, data.data.id)
    if (el) highlighter.highlight(el)
  }
  if (data.type === 'INSPECTING') {
    if (data.data.action === 'start') {
      inspector.start()
    } else if (data.data.action === 'stop') {
      inspector.stop()
    }
  }
})

const m = new MutationObserver(mutationsList => {
  mutationsList.reverse().forEach(item => {
    if (item.type === 'childList') {
      const domToGraph = new DomToGraph({
        add: arg => '__debug' in arg && emissions.add(arg)
      })

      item.addedNodes.forEach(node => domToGraph.add(node))

      connection.send({ type: 'ADDED', data: domToGraph.serialize() })

      const removedNodes = Array.from(item.removedNodes).map(traverseSubtree).flat()
      const removedNodesIds = removedNodes.map((removed: EhNode) => {
        return removed.__easyhard?.id
      }).filter((id): id is string => Boolean(id))

      if (removedNodesIds.length > 0) {
        connection.send({ type: 'REMOVED', data: removedNodesIds })

        removedNodesIds.forEach(emissions.remove)
      }
    } else if (item.type === 'characterData') {
      const target: EhNode = item.target
      const meta = target.__easyhard

      if (!meta) throw new Error('should have __easyhard property')
      connection.send({ type: 'TEXT', data: { id: meta.id, text: target.textContent || '' }})
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