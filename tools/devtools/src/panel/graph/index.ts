import cytoscape, { EdgeSingular } from 'cytoscape'

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

export function createGraph(container: HTMLElement, props: { debug?: boolean } = {}) {
  return cytoscape({
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
          'background-color': '#a9a9a9'
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
          ...getLabelStyle('label', 4, [5, 8])
        }
      },
      {
        selector: 'edge',
        style: {
          'label': 'data(label)',
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
}
