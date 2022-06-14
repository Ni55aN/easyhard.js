import cytoscape, { EdgeSingular, ElementGroup, EventObjectNode } from 'cytoscape'
import { h, onMount } from 'easyhard'
import { css, injectStyles } from 'easyhard-styles'
import { tap } from 'rxjs'
import { Services } from './types'
import { Connection } from './utils/communication'
import dagre from 'cytoscape-dagre'
import { vec2, mat3 } from 'gl-matrix'

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
  wheelSensitivity: 0.25,
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
        'background-color': '#a9a9a9'
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
        'background-color': '#5e86ff'
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
      selector: 'node[type="fragment"]',
      style: {
        'shape': 'ellipse',
        'border-width': 1,
        'border-color': 'black',
        'background-color': '#5e86ff',
        width: 20,
        height: 20,
        label: 'data(label)',
        'font-size': 8
      }
    },
    {
      selector: 'edge',
      style: {
        'curve-style': 'unbundled-bezier',
        'source-endpoint'(el: EdgeSingular) {
          return `${el.connectedNodes()[0].width() / 2}px 0`
        },
        'target-endpoint'(el: EdgeSingular) {
          return `-${el.connectedNodes()[1].width() / 2}px 0`
        },
        'width': 2
      }
    },
    {
      selector: 'edge[type="pipe"]',
      style: {
        'line-color': '#f1c82a',
        'width': 1.5
      }
    },
    {
      selector: 'edge[type="bind"]',
      style: {
        'line-style': 'dashed',
        'line-dash-pattern': [3,1]
      }
    },
  ]
})

function toLocalCoordinates(start: vec2, end: vec2, point: vec2) {
  const vector = vec2.sub(vec2.create(), end, start)
  const dist = vec2.distance(vec2.create(), vector)
  const vectorsAngle = vec2.angle([1,0], vector)
  const angle = (end[1] > start[1] ? vectorsAngle - 2 * Math.PI : -vectorsAngle)

  const scale = mat3.scale(mat3.create(), mat3.create(), [dist, 1])
  const rotate = mat3.rotate(mat3.create(), mat3.create(), angle)
  const translate = mat3.translate(mat3.create(), mat3.create(), start)

  const transform = mat3.mul(mat3.create(), translate, mat3.mul(mat3.create(), rotate, scale))
  const transformInvert = mat3.invert(mat3.create(), transform)

  return vec2.transformMat3(vec2.create(), point, transformInvert)
}

function adjustEdgeCurve(edge: EdgeSingular) {
  const sourcePosition = edge.source().position()
  const targetPosition = edge.target().position()

  const start = vec2.fromValues(sourcePosition.x, sourcePosition.y)
  const end = vec2.fromValues(targetPosition.x, targetPosition.y)

  const distanceX = Math.abs(start[0] - end[0])
  const alpha = 0.25
  const startControl = toLocalCoordinates(start, end, vec2.add(vec2.create(), start, [distanceX * alpha, 0]))
  const middle = toLocalCoordinates(start, end, vec2.div(vec2.create(), vec2.add(vec2.create(), start, end), [2,2]))
  const endControl = toLocalCoordinates(start, end, vec2.add(vec2.create(), end, [-distanceX * alpha, 0]))

  edge.style('control-point-weights', [startControl[0],  middle[0], endControl[0]])
  edge.style('control-point-distances', [startControl[1], middle[1], endControl[1]])
}

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
