import cytoscape, { EventObjectNode } from 'cytoscape'
import { $, h, onMount } from 'easyhard'
import { css } from 'easyhard-styles'
import { pipe } from 'rxjs'
import { map, tap } from 'rxjs/operators'
import { Services } from '../types'
import { Connection } from '../utils/communication'
import { adjustEdgeCurve } from './edges'
import { createGraph } from './graph'
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
const connection = new Connection<Services, 'easyhard-devtools'>('easyhard-devtools', chrome.devtools.inspectedWindow.tabId)

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

const activeInspector = $(false)
const setInspecting = (active: boolean) => {
  connection.postMessage('easyhard-content', { type: 'INSPECTING', data: { action: active ? 'start' : 'stop' }})
  activeInspector.next(active)
}

const headerLeftContent = h('div', {},
  Button({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    label: InspectIcon() as any,
    active: activeInspector,
    click: pipe(map(() => !activeInspector.value), tap(setInspecting))
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
    connection.postMessage('easyhard-content', { type: 'LOG_EMISSION', data: { valueId }})
  },
  fetchValue(id, valueId) {
    connection.postMessage('easyhard-content', { type: 'GET_EMISSION_VALUE', data: { id, valueId, source: 'marbles' }})
  }
})
const sidebar = Sidebar({}, marbles.container)

const main = Splitter({ sizes: [75, 25] }, container, sidebar)

document.body.appendChild(header)
document.body.appendChild(main)

const cy = createGraph(container, { toggle: marbles.toggle, debug })
const areaHighligher = createAreaHighlighter(cy)

connection.addListener(async message => {
  if (message.type === 'GRAPH') {
    marbles.clear()
    setData(cy, message.data)
    await layout(cy, true)
  }
  if (message.type === 'REMOVED') {
    removeNodes(cy, message.data)
  }
  if (message.type === 'ADDED') {
    addNodes(cy, message.data)
    await layout(cy)
  }
  if (message.type === 'TEXT') {
    updateNodeText(cy, message.data.id, message.data.text)
  }
  if (message.type === 'NEXT') {
    const { id, time, valueId } = message.data

    const incomers = cy.getElementById(id).incomers()
      .filter((n): n is cytoscape.NodeSingular => n.isNode())
    const incomersIds = incomers.map(incomer => incomer.data('id') as string)

    marbles.add(id, incomersIds, time, valueId)

    connection.postMessage('easyhard-content', { type: 'GET_EMISSION_VALUE', data: { id, valueId, source: 'tooltip' }})
  }
  if (message.type === 'SUBSCRIBE') {
    const node = cy.getElementById(message.data.id)

    if (!node.length) throw new Error('cannot find node for SUBSCRIBE')
    node.data('subscriptionsCount', message.data.count)
  }
  if (message.type === 'UNSUBSCRIBE') {
    const node = cy.getElementById(message.data.id)

    if (!node.length) throw new Error('cannot find node for UNSUBSCRIBE')
    node.data('subscriptionsCount', message.data.count)
  }
  if (message.type === 'EMISSION_VALUE') {
    const { id, value, type, valueId, source } = message.data

    if (source === 'tooltip') {
      showObservableEmittedValue(cy, id, value)
    } else if (source === 'marbles') {
      marbles.setValue(valueId, value, type)
    }
  }
  if (message.type === 'FOCUS') {
    focusNode(cy, message.data.id, areaHighligher)
  }
  if (message.type === 'STOP_INSPECTING') {
    setInspecting(false)
  }
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

  connection.postMessage('easyhard-content', { type: 'INSPECT', data: { id }})
})
cy.on('mouseout', 'node', () => {
  connection.postMessage('easyhard-content', { type: 'INSPECT', data: null })
})

cy.on('tap', 'node', e => {
  const node = e.target as cytoscape.NodeSingular
  const id = node.data('id') as string

  if (node.data('type') === 'observable') {
    marbles.focus(id)
  }
})

cy.on('mousemove', () => {
  areaHighligher.hide()
})

onMount(container, () => {
  setTimeout(() => {
    connection.postMessage('easyhard-content', { type: 'GET_GRAPH' })
  }, 200)
})

window.addEventListener('resize', () => {
  cy.resize()
})
