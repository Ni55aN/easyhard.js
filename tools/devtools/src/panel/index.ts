import cytoscape, { EventObjectNode } from 'cytoscape'
import { $, h, onMount } from 'easyhard'
import { css } from 'easyhard-styles'
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
import { createMarbles, MarblesMode } from './marbles'
import { Switch } from './shared/Switch'
import { focusNode } from './graph/focus'

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

const marblesMode = $<MarblesMode>('graph')
const hederRightContent = h('div', {},
  Switch({ model: marblesMode, options: [{ key: 'timeline', label: 'Timeline' }, { key: 'graph', label: 'Graph' }]})
)
const header = Header({ styles: { gridArea: 'a' }, content: { right: hederRightContent }})
const container = Main({})

const marbles = createMarbles({
  mode: marblesMode,
  debug,
  lineSelect(id) {
    focusNode(cy, id)
  }
})
const sidebar = Sidebar({}, marbles.container)

const main = Splitter({ sizes: [75, 25] }, container, sidebar)

document.body.appendChild(header)
document.body.appendChild(main)

const cy = createGraph(container, { debug })

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
    const { id, value, time } = message.data

    showObservableEmittedValue(cy, id, value)

    const incomers = cy.getElementById(id).incomers()
      .filter((n): n is cytoscape.NodeSingular => n.isNode())
    const incomersIds = incomers.map(incomer => incomer.data('id') as string)

    marbles.add(value, id, incomersIds, time)
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

onMount(container, () => {
  setTimeout(() => {
    connection.postMessage('easyhard-content', { type: 'GET_GRAPH' })
  }, 200)
})

window.addEventListener('resize', () => {
  cy.resize()
})
