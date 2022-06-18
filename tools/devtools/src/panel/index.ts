import { EventObjectNode } from 'cytoscape'
import { onMount } from 'easyhard'
import { css } from 'easyhard-styles'
import { tap } from 'rxjs'
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

// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
const connection = new Connection<Services, 'easyhard-devtools'>('easyhard-devtools', chrome.devtools.inspectedWindow.tabId)

const onClick = tap(() => {
  connection.postMessage('easyhard-content', { type: 'GET_GRAPH' })
})

const bodyStyles = css({
  margin: 0,
  display: 'grid',
  gridTemplateRows: '3em 1fr',
  gridTemplateColumns: '1fr 12em',
  gridTemplateAreas: '"a a" "b c"',
  height: '100vh',
  width: '100vw'
})

document.body.classList.add(bodyStyles.className)

const header = Header({ click: onClick, styles: { gridArea: 'a' }})
const container = Main({ styles: { gridArea: 'b' }})
const sidebar = Sidebar({ styles: { gridArea: 'c' }})

document.body.appendChild(header)
document.body.appendChild(container)
document.body.appendChild(sidebar)

const cy = createGraph(container)

connection.addListener(async message => {
  if (message.type === 'GRAPH') {
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
    showObservableEmittedValue(cy, message.data.id, message.data.value)
  }
})

cy.on('layoutstop', () => {
  cy.edges().forEach(edge => adjustEdgeCurve(edge))
})
cy.on('drag', (el: EventObjectNode) => {
  el.target.connectedEdges().forEach(edge => adjustEdgeCurve(edge))
})

onMount(container, () => {
  setTimeout(() => {
    connection.postMessage('easyhard-content', { type: 'GET_GRAPH' })
  }, 200)
})

window.addEventListener('resize', () => {
  cy.resize()
})
