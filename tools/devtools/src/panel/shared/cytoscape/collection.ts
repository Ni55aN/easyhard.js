import { CollectionReturnValue, Core, NodeSingular } from 'cytoscape'

export function successorsUntil(cy: Core, node: CollectionReturnValue | NodeSingular, selector: string, cond: (el: NodeSingular) => boolean) {
  const col = cy.collection()
  const outgoers = node.outgoers(selector)

  col.merge(outgoers)

  outgoers.forEach(node => {
    if (node.isNode() && cond(node)) {
      col.merge(successorsUntil(cy, node, selector, cond))
    }
  })

  return col
}

export function predecessorsUntil(cy: Core, node: CollectionReturnValue | NodeSingular, selector: string, cond: (el: NodeSingular) => boolean) {
  const col = cy.collection()
  const incomers = node.incomers(selector)

  col.merge(incomers)

  incomers.forEach(node => {
    if (node.isNode() && cond(node)) {
      col.merge(predecessorsUntil(cy, node, selector, cond))
    }
  })

  return col
}
