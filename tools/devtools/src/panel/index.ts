import cytoscape, { EventObjectNode } from 'cytoscape'
import { $, h } from 'easyhard'
import { css } from 'easyhard-styles'
import { easyhardResponser } from 'easyhard-post-message'
import { BehaviorSubject, merge, EMPTY, OperatorFunction, pipe, Subject } from 'rxjs'
import { catchError, map, switchMap, tap } from 'rxjs/operators'
import { EmissionValueRequest, GraphNodeType, InpectorAction, Services, ServicesScheme } from '../types'
import { Connection } from '../utils/communication'
import { adjustEdgeCurve } from './edges'
import { createGraph, getTypeCategory } from './graph'
import { Header } from './header'
import { Sidebar } from './sidebar'
import { Main } from './main'
import { layout } from './graph/layout'
import { addNodes, removeNodes, setData, updateNodeText } from './graph/data'
import { showObservableEmittedValue } from './graph/tooltip'
import { Splitter } from './splitter'
import { createMarbles } from './marbles'
import { Button } from './shared/Button'
import { InspectIcon } from '../assets/icons/inspect'
import { focusNode } from './shared/cytoscape/focus'
import { createAreaHighlighter } from './shared/cytoscape/highligher'
import { syncGroups } from './graph/group'

const debug = Boolean(process.env.DEBUG)

// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
const connection = new Connection<Services>('easyhard-devtools', 'easyhard-content', chrome.devtools.inspectedWindow.tabId)

const requestEmissionValue = new Subject<EmissionValueRequest>()
const logEmission = new Subject<{ valueId: string }>()
const inspectorActive = $(false)
const inspect = new BehaviorSubject<InpectorAction | null>(null)

const bodyStyles = css({
  margin: 0,
  display: 'grid',
  gridTemplateRows: '3em 1fr',
  gridTemplateColumns: '1fr',
  gridTemplateAreas: '"a" "b"',
  height: '100vh',
  width: '100vw'
})

document.body.classList.add(bodyStyles.className)

const headerLeftContent = h('div', {},
  Button({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    label: InspectIcon() as any,
    active: inspectorActive,
    click: tap(() => inspectorActive.next(!inspectorActive.value))
  })
)

const header = Header({ styles: { gridArea: 'a' }, content: {
  left: headerLeftContent
}})
const container = Main({})

const marbles = createMarbles({
  debug,
  lineSelect(id) {
    if (cy.hasElementWithId(id)) {
      focusNode(cy, id, areaHighligher)
    }
  },
  log(valueId) {
    if (Array.isArray(valueId)) {
      valueId.forEach(id => logEmission.next({ valueId: id }))
    } else {
      logEmission.next({ valueId })
    }
  },
  fetchValue(id, valueId) {
    requestEmissionValue.next({ id, valueId, source: 'marbles' })
  }
})
const sidebar = Sidebar({}, marbles.container)

const main = Splitter({ sizes: [75, 25] }, container, sidebar)

document.body.appendChild(header)
document.body.appendChild(main)

const graph = createGraph(container, { toggle: marbles.toggle, debug })
const { cy } = graph
const areaHighligher = createAreaHighlighter(cy)

function _catch<T,K>(op: OperatorFunction<T,K>) {
  return pipe(
    op,
    catchError(e => {
      console.error(e)
      return EMPTY
    })
  )
}

easyhardResponser<ServicesScheme>(connection, {
  graph: _catch(tap(async data => {
    if ('graph' in data) {
      marbles.clear()
      setData(graph, data.graph)
      await layout(cy, true)
    }
    if ('removed' in data) {
      removeNodes(graph, data.removed)
    }
    if ('added' in data) {
      addNodes(graph, data.added)
      await layout(cy)
    }
    if ('text' in data) {
      updateNodeText(cy, data.text.id, data.text.value)
    }

    syncGroups(cy)
  })),
  subscriptions: _catch(tap(data => {
    if ('subscribe' in data) {
      const { id, count } = data.subscribe
      const node = graph.getElementById(id)

      if (node.length) {
        node.data('subscriptionsCount', count)
        cy.$(`node[type="observable-group"][endNodeId="${id}"]`).data('subscriptionsCount', count)
      }
    }
    if ('unsubscribe' in data) {
      const { id, count } = data.unsubscribe
      const node = graph.getElementById(id)

      if (node.length) {
        node.data('subscriptionsCount', count)
        cy.$(`node[type="observable-group"][endNodeId="${id}"]`).data('subscriptionsCount', count)
      }
    }
  })),
  requestEmissionValue,
  emission: _catch(tap(data => {
    const { id, time, valueId } = data.next

    const incomers = graph.getElementById(id).incomers()
      .filter((n): n is cytoscape.NodeSingular => n.isNode())
    const incomersIds = incomers.map(incomer => incomer.data('id') as string)

    marbles.add(id, incomersIds, time, valueId)

    requestEmissionValue.next({ id, valueId, source: 'tooltip' })
  })),
  emissionValue: _catch(tap(data => {
    const { id, value, type, valueId, source } = data

    if (source === 'tooltip') {
      if (cy.hasElementWithId(id)) {
        showObservableEmittedValue(cy, id, value)
      }
    } else if (source === 'marbles') {
      marbles.setValue(valueId, value, type)
    }
  })),
  logEmission,
  focus: _catch(tap(data => {
    focusNode(cy, data.id, areaHighligher)
  })),
  inspector: _catch(pipe(
    tap(active => inspectorActive.next(active)),
    switchMap(() => merge(inspect, inspectorActive.pipe(map(active => ({ active })))))
  ))
})

cy.on('layoutstop', () => {
  cy.edges().forEach(edge => adjustEdgeCurve(edge))
})
cy.on('drag', (el: EventObjectNode) => {
  el.target.connectedEdges().forEach(edge => adjustEdgeCurve(edge))
})

cy.on('mouseover', 'node', e => {
  const node = e.target as cytoscape.NodeSingular
  const id = node.data('id')

  inspect.next({ id })
})
cy.on('mouseout', 'node', () => {
  inspect.next(null)
})

cy.on('tap', 'node', e => {
  const node = e.target as cytoscape.NodeSingular
  const id = node.data('id') as string
  const type = node.data('type') as GraphNodeType

  if (type === 'observable') {
    marbles.focus(id)
  }
  if (type === 'observable-group') {
    marbles.focus(node.data('endNodeId') as string)
  }
  if (getTypeCategory(type) === 'dom') {
    chrome.devtools.inspectedWindow.eval(`
    var node = window.findElementByDebugId(document.body, "${id}")
    inspect(node instanceof Text && !node.textContent ? node.parentNode : node)
    `,
    console.log
    )
  }
})

cy.on('mousemove', () => {
  areaHighligher.hide()
})

window.addEventListener('resize', () => {
  cy.resize()
})
