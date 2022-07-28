import cytoscape  from 'cytoscape'
import expandCollapse  from 'cytoscape-expand-collapse'
import { layoutOptions } from './layout'

// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
cytoscape.use(expandCollapse)

type Core = { expandCollapse: (args: any) => any}

type API = {
  collapse: (nodes: cytoscape.NodeCollection) => void
  collapseAll: () => void
  collapsibleNodes: (nodes?: cytoscape.NodeCollection) => cytoscape.NodeCollection
  getCollapsedChildren: any
}

export function getGroupAPI(cy: cytoscape.Core): API {
  return (cy as unknown as Core).expandCollapse('get')
}

export function getGroupId(endNodeId: string) {
  return `${endNodeId}_group`
}

export function initGroups(cy: cytoscape.Core) {
  const core = cy as unknown as Core
  core.expandCollapse({
    layoutBy: layoutOptions(true),
    fisheye: true,
    animate: false,
    undoable: false
  })
}

function ensureGroupExists(cy: cytoscape.Core) {
  const endGroupNodes = cy.nodes().filter(n => n.data('group'))
  const withoutParent = endGroupNodes.filter(n => !cy.hasElementWithId(getGroupId(n.data('id') as string)))

  withoutParent.forEach(endNode => {
    const endNodeId = endNode.data('id') as string
    const id = `${endNodeId}_group`
    const props = endNode.data('group') as { name: string, start: string }
    const startNode = cy.getElementById(props.start)
    if (!startNode) throw new Error('cannot find start node')

    const group = cy.add({
      group: 'nodes',
      data: {
        id,
        label: props.name,
        type: 'observable-group',
        subscriptionsCount: 0,
        endNodeId
      }
    })
    const commonNodes = startNode.successors().intersection(endNode.predecessors())

    cy.collection().add(startNode).add(commonNodes).add(endNode).move({ parent: id })
    requestAnimationFrame(() => getGroupAPI(cy).collapse(group))
    group
  })
}

function syncVisibility(cy: cytoscape.Core) {
  cy.elements('[type="observable-group"]').forEach(node => {
    const children = node.children()
    const visible = children.filter(child => {
      return child.css('display') !== 'none'
    })

    if (children.length > 0) {
      node.css('display', visible.length === 0 ? 'none' : 'element')
    }
  })
}

export function syncGroups(cy: cytoscape.Core) {
  ensureGroupExists(cy)
  syncVisibility(cy)
}
