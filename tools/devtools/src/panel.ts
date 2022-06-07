import cytoscape, { ElementGroup } from 'cytoscape'
import { h, onMount } from 'easyhard'
import { css, injectStyles } from 'easyhard-styles'
import { tap } from 'rxjs'
import { Services } from './types'
import { Connection } from './utils/communication'
import dagre  from 'cytoscape-dagre'

/* eslint-disable @typescript-eslint/no-unsafe-argument */
cytoscape.use(dagre)
/* eslint-enable @typescript-eslint/no-unsafe-argument */

// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
const connection = new Connection<Services, 'easyhard-devtools'>('easyhard-devtools', chrome.devtools.inspectedWindow.tabId)

connection.addListener(async message => {
  if (message.type === 'GRAPH') {
    cy.elements().remove()
    cy.add([
      ...message.data.nodes.map(data => ({ group: 'nodes' as ElementGroup, data })),
      ...message.data.edges.map(data => ({ group: 'edges' as ElementGroup, data }))
    ])

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    await cy.elements().makeLayout({
      name: 'dagre',
      rankDir: 'LR',
      ranker: 'tight-tree',
      spacingFactor: 0.56,
      minLen(edge: any) {
        const nodes = edge.connectedNodes().map((n: any) => n.data())

        if ((nodes[0].type === 'observable') !== (nodes[1].type === 'observable')) {
          return 6
        }

        return 1
      },
      animate: true
    } as any).run().promiseOn('layoutstop')
  }
})

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

const panelStyles = css({
  background: 'grey',
  width: '100%',
  height: '100%',
  gridArea: 'a'
})
const panel =  h('div', { click: onClick } , injectStyles(panelStyles), 'Panel')
document.body.appendChild(panel)

const scontainerStyles = css({
  width: '100%',
  height: '100%',
  gridArea: 'b',
  overflow: 'hidden'
})
const container = h('div', {}, injectStyles(scontainerStyles))
document.body.appendChild(container)

const sidebarStyles = css({
  background: 'red',
  width: '100%',
  height: '100%',
  gridArea: 'c'
})
const sidebar =  h('div', {}, injectStyles(sidebarStyles), 'Sidebar')
document.body.appendChild(sidebar)


const cy = cytoscape({
  container,
  style: [
    {
      'selector': 'node[label]',
      'style': {
        label(ele: cytoscape.NodeSingular) {
          const label = String(ele.data('label'))

          return label.length > 6 ? label.substring(0, 7) + '...' : label
        },
        'text-valign': 'center',
        'text-halign': 'center',
        'font-size'(ele: cytoscape.NodeSingular) {
          const label = String(ele.data('label'))

          return label.length > 6 ? 8 : 10
        },
        width: 45,
        height: 25
      }
    },
    {
      selector: 'node[type="node"]',
      style: {
        'shape': 'round-rectangle',
        'border-width': 2,
        'border-color': 'white',
        'background-color': '#5e86ff'
      }
    },
    {
      selector: 'node[type="text"]',
      style: {
        'shape': 'round-rectangle',
        'border-width': 2,
        'border-color': 'white',
        'background-color': '#a9a9a9'
      }
    },
    {
      selector: 'node[type="eh-node"]',
      style: {
        'shape': 'round-rectangle',
        'border-width': 1,
        'border-color': 'black',
        'background-color': '#5e86ff'
      }
    },
    {
      selector: 'node[type="eh-text"]',
      style: {
        'shape': 'round-rectangle',
        'border-width': 1,
        'border-color': 'black',
        'background-color': '#a9a9a9'
      }
    },
    {
      selector: 'node[type="observable"]',
      style: {
        'shape': 'round-rectangle',
        'border-width': 1,
        'border-color': 'black',
        'background-color': '#f1c82a',
        color: 'white'
      }
    },
    {
      selector: 'edge',
      style: {
        'curve-style': 'bezier',
        'control-point-step-size': 10
      }
    },
  ]
})

onMount(container, () => {
  setTimeout(() => {
    connection.postMessage('easyhard-content', { type: 'GET_GRAPH' })
  }, 200)
})

window.addEventListener('resize', () => {
  cy.resize()
})
