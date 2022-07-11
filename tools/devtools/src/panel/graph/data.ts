import { Core, ElementGroup } from 'cytoscape'
import { Graph } from '../../types'
import { setupTooltips } from './tooltip'

export function setData(cy: Core, data: Graph) {
  cy.elements().remove()
  const els = cy.add([
    ...data.nodes.map(data => ({ group: 'nodes' as ElementGroup, data })),
    ...data.edges.map(data => ({ group: 'edges' as ElementGroup, data }))
  ])

  setupTooltips(els)
}

export function removeNodes(cy: Core, idsToRemove: string[]) {
  const allNodes = cy.elements('node')
  const shouldBeRemovedAndDependencies = allNodes.filter((node: cytoscape.NodeSingular) => {
    const id = node.data('id') as string
    return idsToRemove.includes(id)
  })
  shouldBeRemovedAndDependencies.remove()
}

export function addNodes(cy: Core, data: Graph) {
  const els = cy.add([
    ...data.nodes.map(data => ({ group: 'nodes' as ElementGroup, data })),
    ...data.edges.map(data => ({ group: 'edges' as ElementGroup, data }))
  ])

  setupTooltips(els)
}

export function updateNodeText(cy: Core, id: string, text: string) {
  const node = cy.getElementById(id)

  node.data('label', text)
}
