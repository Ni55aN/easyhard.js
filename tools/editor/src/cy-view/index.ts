import cytoscape, { Core, EdgeSingular, NodeSingular } from 'cytoscape'
import dagre from 'cytoscape-dagre'
import klay from 'cytoscape-klay'

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
          width(el: NodeSingular) {
            return `${String(el.data('label')).length * 5.5 + 10}px`
          }
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
          'text-margin-x'(edge: cytoscape.EdgeSingular) {
            const { h, w } = edge.boundingBox()
            const d = Math.sqrt(h ** 2 + w ** 2) / 2

            // edge.bodyBounds
            return 0
          },
          // 'text-margin-y': -10,
          'text-background-color': '#ffffff',
          'target-arrow-shape': 'triangle',
          'curve-style': 'straight',
          'source-endpoint'(el: EdgeSingular) {
            return `${el.connectedNodes()[0].outerWidth() / 2}px 0`
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
  const layoutInstance = cy.makeLayout({
    // name: 'dagre',
    // rankDir: 'LR',
    // ranker: 'tight-tree',
    // spacingFactor: 0.6,
    name: 'klay',
    fit
  } as any)
  const onStop = layoutInstance.promiseOn('layoutstop')

  layoutInstance.run()
  await onStop
}

