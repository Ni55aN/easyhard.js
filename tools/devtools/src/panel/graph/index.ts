import { h } from 'easyhard'
import cytoscape, { EdgeSingular } from 'cytoscape'
import { createNodesBadge } from '../shared/cytoscape/badge'
import { createContextMenu } from '../shared/cytoscape/context-menu'
import { toggleObservables, TogglerKey, toggleSubGraph } from './toggler'
import * as selectors from './selectors'

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

export function getTypeCategory<T extends string | GraphNodeType>(type: T) {
  if (['observable'].includes(type)) return 'observable'
  if (['eh-text', 'text', 'node', 'eh-node', 'fragment'].includes(type)) return 'dom'

  return null
}

function isChildrenHidden(node: cytoscape.NodeSingular) {
  return Boolean(node.data(TogglerKey.ChildrenHidden))
}

function isObservablesHidden(node: cytoscape.NodeSingular) {
  return Boolean(node.data(TogglerKey.ObservablesHidden))
}

function isParentsHidden(node: cytoscape.NodeSingular) {
  return Boolean(node.data(TogglerKey.ParentsHidden))
}

export function createGraph(container: HTMLElement, props: { toggle?: (id: string, hidden: boolean) => void, debug?: boolean } = {}) {
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
          ...getBackground('#a9a9a9', el => ({
            leftGradient: isObservablesHidden(el),
            rightGradient: isChildrenHidden(el)
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
        style: <any>{
          'shape': 'round-rectangle',
          'border-width': 1,
          'border-color': 'black',
          ...getBackground('#5e86ff', el => ({
            leftGradient: isObservablesHidden(el),
            rightGradient: isChildrenHidden(el)
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
          ...getBackground('#f1c82a', el => ({
            leftGradient: isParentsHidden(el),
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
          ...getBackground('#5e86ff', el => ({
            leftGradient: isObservablesHidden(el),
            rightGradient: isChildrenHidden(el)
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
            const type = nodes[0].data('type')

            return getTypeCategory(type) === 'observable' ? '#f1c82a' : '#7e7e7e'
          },
          'width'(edge: EdgeSingular) {
            const nodes = edge.connectedNodes()
            const type = nodes[0].data('type')

            return getTypeCategory(type) === 'observable' ? 1.5 : 2
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

  createContextMenu(cy, selectors.elements, element => {
    const node = cy.getElementById(element.data('id') as string)
    const observablesHidden = isObservablesHidden(node)
    const childrenHidden = isChildrenHidden(node)

    return [
      {
        content:  h('span', {}, observablesHidden ? 'Show observables' : 'Hide observables'),
        select: () => {
          node.data(TogglerKey.ObservablesHidden, !observablesHidden)
          toggleObservables(cy, node, !observablesHidden, props.toggle)
        }
      },
      {
        content:  h('span', {}, childrenHidden ? 'Show children' : 'Hide children'),
        select: () => {
          node.data(TogglerKey.ChildrenHidden, !childrenHidden)
          toggleSubGraph(cy, node, !childrenHidden, props.toggle)
        }
      }
    ]
  })

  createContextMenu(cy, selectors.observable, element => {
    const node = cy.getElementById(element.data('id') as string)
    const parentsHidden = isParentsHidden(node)

    return [
      {
        content:  h('span', {}, parentsHidden ? 'Show parents' : 'Hide parents'),
        select: () => {
          node.data(TogglerKey.ParentsHidden, !parentsHidden)
          toggleObservables(cy, node, !parentsHidden, props.toggle)
        }
      }
    ]
  })

  return cy
}
