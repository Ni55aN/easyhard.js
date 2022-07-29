import { Core, ElementGroup } from 'cytoscape'
import { GraphView } from '.'
import { Graph } from '../../types'

export function setData(graph: GraphView, data: Graph) {
  graph.clear()
  graph.add([
    ...data.nodes.map(data => ({ group: 'nodes' as ElementGroup, data })),
    ...data.edges.map(data => ({ group: 'edges' as ElementGroup, data }))
  ])
}

export function removeNodes(graph: GraphView, idsToRemove: string[]) {
  const allNodes = graph.elements().filter('node')
  const shouldBeRemovedAndDependencies = allNodes.filter((node: cytoscape.NodeSingular) => {
    const id = node.data('id') as string
    return idsToRemove.includes(id)
  })

  graph.remove(shouldBeRemovedAndDependencies)
}

export function addNodes(cy: GraphView, data: Graph) {
  cy.add([
    ...data.nodes.map(data => ({ group: 'nodes' as ElementGroup, data })),
    ...data.edges.map(data => ({ group: 'edges' as ElementGroup, data }))
  ])
}

export function updateNodeText(cy: Core, id: string, text: string) {
  const node = cy.getElementById(id)

  node.data('label', text)
}
