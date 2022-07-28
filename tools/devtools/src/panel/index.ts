import cytoscape, { EventObjectNode } from 'cytoscape'
import { $, h } from 'easyhard'
import { css } from 'easyhard-styles'
import { easyhardResponser } from 'easyhard-post-message'
import { BehaviorSubject, merge, pipe, Subject } from 'rxjs'
import { map, switchMap, tap } from 'rxjs/operators'
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
    focusNode(cy, id, areaHighligher)
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

const cy = createGraph(container, { toggle: marbles.toggle, debug })
const areaHighligher = createAreaHighlighter(cy)


easyhardResponser<ServicesScheme>(connection, {
  graph: tap(async data => {
    if ('graph' in data) {
      marbles.clear()
      setData(cy, data.graph)
      await layout(cy, true)
    }
    if ('removed' in data) {
      removeNodes(cy, data.removed)
    }
    if ('added' in data) {
      addNodes(cy, data.added)
      await layout(cy)
    }
    if ('text' in data) {
      updateNodeText(cy, data.text.id, data.text.value)
    }
  }),
  subscriptions: tap(data => {
    if ('subscribe' in data) {
      const node = cy.getElementById(data.subscribe.id)

      if (!node.length) throw new Error('cannot find node for SUBSCRIBE')
      node.data('subscriptionsCount', data.subscribe.count)
    }
    if ('unsubscribe' in data) {
      const node = cy.getElementById(data.unsubscribe.id)

      if (!node.length) throw new Error('cannot find node for UNSUBSCRIBE')
      node.data('subscriptionsCount', data.unsubscribe.count)
    }
  }),
  requestEmissionValue,
  emission: tap(data => {
    const { id, time, valueId } = data.next

    const incomers = cy.getElementById(id).incomers()
      .filter((n): n is cytoscape.NodeSingular => n.isNode())
    const incomersIds = incomers.map(incomer => incomer.data('id') as string)

    marbles.add(id, incomersIds, time, valueId)

    requestEmissionValue.next({ id, valueId, source: 'tooltip' })
  }),
  emissionValue: tap(data => {
    const { id, value, type, valueId, source } = data

    if (source === 'tooltip') {
      showObservableEmittedValue(cy, id, value)
    } else if (source === 'marbles') {
      marbles.setValue(valueId, value, type)
    }
  }),
  logEmission,
  focus: tap(data => {
    focusNode(cy, data.id, areaHighligher)
  }),
  inspector: pipe(
    tap(active => inspectorActive.next(active)),
    switchMap(() => merge(inspect, inspectorActive.pipe(map(active => ({ active })))))
  )
})

cy.on('layoutstop', () => {
  cy.edges().forEach(edge => adjustEdgeCurve(edge))
})
cy.on('drag', (el: EventObjectNode) => {
  el.target.connectedEdges().forEach(edge => adjustEdgeCurve(edge))
})
cy.on('remove', e => {
  if (e.target.isNode()) {
    const id: string = e.target.data('id')

    marbles.remove(id)
  }
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
