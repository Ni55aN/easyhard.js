import { Core, ElementGroup } from 'cytoscape'
import { Graph } from '../../types'

export function setData(cy: Core, data: Graph) {
  cy.elements().remove()
  cy.add([
    ...data.nodes.map(data => ({ group: 'nodes' as ElementGroup, data })),
    ...data.edges.map(data => ({ group: 'edges' as ElementGroup, data }))
  ])
}

export function removeNodes(cy: Core, idsToRemove: string[]) {
  const allNodes = cy.elements('node')
  const shouldBeRemovedAndDependencies = allNodes.filter((node: cytoscape.NodeSingular) => {
    const id = node.data('id') as string
    return idsToRemove.includes(id)
  })

  const orphanObservable = cy.elements('node')
    .filter((n: cytoscape.NodeSingular) => n.data('type') === 'observable')
    .filter((n: cytoscape.NodeSingular) => {
      const t = n.successors()
        .filter((n): n is cytoscape.NodeSingular => n.isNode())
        .filter((n: cytoscape.NodeSingular) => n.data('type') !== 'observable')

      return t.length === 0
    })

  shouldBeRemovedAndDependencies.remove()
  orphanObservable.remove()
}

export function addNodes(cy: Core, data: Graph) {
  cy.add([
    ...data.nodes.map(data => ({ group: 'nodes' as ElementGroup, data })),
    ...data.edges.map(data => ({ group: 'edges' as ElementGroup, data }))
  ])
}

export function updateNodeText(cy: Core, id: string, text: string) {
  const node = cy.getElementById(id)

  node.data('label', text)
}
