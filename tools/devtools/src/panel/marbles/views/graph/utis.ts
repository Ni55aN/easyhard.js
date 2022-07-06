import { Core, NodeCollection } from 'cytoscape'

export function filterFullyVisibleNodes(cy: Core, nodes: NodeCollection, minZoom: number) {
  const ext = cy.extent()

  if (cy.zoom() < minZoom) return cy.collection()

  return nodes.filter(node => {
    const bb = node.boundingBox({})
    const isVisible = bb.x1 > ext.x1 && bb.x2 < ext.x2 && bb.y1 > ext.y1 && bb.y2 < ext.y2

    return isVisible
  })
}
