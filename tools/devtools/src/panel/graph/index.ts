import cytoscape, { EdgeSingular } from 'cytoscape'
import { createNodesBadge } from '../shared/cytoscape/badge'

function getLabelStyle(key: string, maxLength: number, sizes: [number, number], debug?: boolean) {
  return {
    label(ele: cytoscape.NodeSingular) {
      const label = ele.data(key)

      if (debug) {
        return [label, ele.data('id')].join('\n')
      }

      return label
    },
    'font-size'(ele: cytoscape.NodeSingular) {
      const label = String(ele.data('label'))
      const scale = debug ? 0.7 : 1

      return (label.length > maxLength ? sizes[0] : sizes[1]) * scale
    },
  }
}

function getBackground(color: string, props: (el: cytoscape.NodeSingular) => { leftGradient: boolean, rightGradient: boolean }) {
  return {
    'background-color': color,
    'background-fill': 'linear-gradient',
    'background-gradient-stop-colors': (el: cytoscape.NodeSingular) => {
      const { leftGradient, rightGradient } = props(el)
      return `${leftGradient ? 'white' : color} ${color} ${rightGradient ? 'white' : color}`
    },
    'background-gradient-stop-positions': '0 50 100',
    'background-gradient-direction': 'to-right'
  }
}

export function createGraph(container: HTMLElement, props: { debug?: boolean } = {}) {
  const cy = cytoscape({
    container,
    wheelSensitivity: 0.25,
    style: [
      {
        'selector': 'node[label]',
        'style': {
          'text-wrap': props.debug ? 'wrap' : 'ellipsis',
          'text-max-width': '40',
          'text-valign': 'center',
          'text-halign': 'center',
          width: 45,
          height: 25,
          ...getLabelStyle('label', 6, [8, 10], props.debug)
        }
      },
      {
        selector: 'node[type="node"]',
        style: {
          'shape': 'round-rectangle',
          'border-width': 1,
          'border-color': 'white',
          ...getBackground('#a9a9a9', () => ({
            leftGradient: false,
            rightGradient: false
          }))
        }
      },
      {
        selector: 'node[type="text"]',
        style: {
          'shape': 'round-rectangle',
          'border-width': 1,
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
          ...getBackground('#5e86ff', () => ({
            leftGradient: false,
            rightGradient: false
          }))
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
          ...getBackground('#f1c82a', () => ({
            leftGradient: false,
            rightGradient: false
          })),
          color: 'white',
          opacity(el: cytoscape.NodeSingular) {
            return +el.data('subscriptionsCount') > 0 ? 1 : 0.4
          },
        }
      },
      {
        selector: 'node[type="fragment"]',
        style: {
          'shape': 'ellipse',
          'border-width': 1,
          'border-color': 'black',
          ...getBackground('#5e86ff', () => ({
            leftGradient: false,
            rightGradient: false
          })),
          width: 20,
          height: 20,
          ...getLabelStyle('label', 4, [5, 8], props.debug)
        }
      },
      {
        selector: 'edge',
        style: {
          'label': 'data(label)',
          'text-rotation': 'autorotate',
          'font-size': 10,
          'color': '#f1c82a',
          'text-background-opacity': 1,
          'text-background-color': '#ffffff',
          'curve-style': 'unbundled-bezier',
          'source-endpoint'(el: EdgeSingular) {
            return `${el.connectedNodes()[0].width() / 2}px 0`
          },
          'target-endpoint'(el: EdgeSingular) {
            return `-${el.connectedNodes()[1].width() / 2}px 0`
          },
          'line-color'(edge: EdgeSingular) {
            const nodes = edge.connectedNodes()

            return nodes[0].data('type') === 'observable' ? '#f1c82a' : '#7e7e7e'
          },
          'width'(edge: EdgeSingular) {
            const nodes = edge.connectedNodes()

            return nodes[0].data('type') === 'observable' ? 1.5 : 2
          }
        }
      },
      {
        selector: 'edge[type="argument"]',
        style: {
          'line-style': 'dashed',
          'line-dash-pattern': [3,1]
        }
      },
    ]
  })

  createNodesBadge(cy, () => cy.elements('node[type="observable"]'), node => {
    const count = node.data('subscriptionsCount')

    return count > 0 && String(count)
  })

  return cy
}
