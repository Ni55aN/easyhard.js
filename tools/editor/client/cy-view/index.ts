import cytoscape, { Core, EdgeSingular, NodeSingular } from 'cytoscape'
import dagre from 'cytoscape-dagre'
import klay from 'cytoscape-klay'
import _ from 'lodash'
import { layoutELK } from './elk'

cytoscape.use(dagre)
cytoscape.use(klay)

export function createEditor(container: HTMLElement) {
  const cy = cytoscape({
    container,
    wheelSensitivity: 0.2,
    style: [
      {
        'selector': 'node[type]',
        'style': {
          'shape': 'round-rectangle',
          'label': 'data(label)',
          'text-halign': 'center',
          'text-valign'(el: NodeSingular) {
            return el.data('type') === 'FunctionDeclaration' ? 'top' : 'center'
          },
          'font-size': '11px',
          'text-wrap': 'wrap',
          'text-max-width': '60px',
          width(el: NodeSingular) {
            return `${Math.min(60, String(el.data('label')).length * 5.5 + 10)}px`
          },
          backgroundColor(el: NodeSingular) {
            const type = String(el.data('type'))

            if (['Literal', 'VariableDeclaration'].includes(type)) return '#ffcb3a'
            if (['Type', 'StringType', 'NumberType', 'BooleanType', 'UnionType', 'IntersectionType'].includes(type)) return '#6d9572'
            return '#888'
          }
        }
      },
      {
        'selector': 'node:parent',
        'style': {
          backgroundColor: '#ccc',
          "border-color": 'white'
        }
      },
      {
        'selector': 'edge',
        'style': {
          'label': 'data(label)',
          'text-rotation': 'autorotate',
          'font-size': 9,
          'color': '#8c8c8c',
          'text-background-opacity': 1,
          'text-background-color': '#ffffff',
          'target-arrow-shape': 'triangle',
          'curve-style': 'unbundled-bezier',
          'width'(el: EdgeSingular) {
            return el.data('label') ? 2 : 3
          },
          'source-endpoint'(el: EdgeSingular) {
            const node = el.connectedNodes()[0]
            return node.isParent() ? 'outside-to-line' : `${node.outerWidth() / 2}px 0` // prevent incorrect curve for parent source
          },
          'target-endpoint'(el: EdgeSingular) {
            return `-${el.connectedNodes()[1].outerWidth() / 2}px 0`
          },
        }
      }
    ]
  })

  cy.on('position', 'node', e => {
    e.target.parent().connectedEdges().data('rnd', true) // force update edge styles
  })

  return cy
}

export async function layout(cy: Core, fit = false) {
  await layoutELK(cy, fit)
  // const layoutInstance = cy.makeLayout({
  //   // name: 'dagre',
  //   // rankDir: 'LR',
  //   // ranker: 'tight-tree',
  //   // spacingFactor: 0.6,
  //   // klay: {
  //   //   nodePlacement: 'LINEAR_SEGMENTS',
  //   //   layoutHierarchy: true,
  //   //   direction: 'RIGHT',
  //   //   fixedAlignment: 'LEFTDOWN',
  //   //   linearSegmentsDeflectionDampening: 0.1
  //   // },
  //   fit
  // } as any)
  // const onStop = layoutInstance.promiseOn('layoutstop')

  // layoutInstance.run()
  // await onStop
}

