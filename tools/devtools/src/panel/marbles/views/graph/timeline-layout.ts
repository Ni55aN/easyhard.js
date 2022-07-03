import cytoscape from 'cytoscape'
import { dfsTopSort } from './dfs-sort'

export function timelineLayout(cy: cytoscape.Core, props: { fit: boolean, field: string, spacing: number, start: number, scale: number }) {
  cy.nodes().forEach(node => {
    const x = (+node.data(props.field) - props.start) * props.scale

    node.position({ x, y: 0 })
  })
  const els = cy.elements(':parent').map((parent: cytoscape.NodeSingular) => {
    return parent
  })

  const result = dfsTopSort(
    () => els.map(n => n.data('id')),
    id => cy.getElementById(id).children().incomers().parents().map(p => p.data('id'))
  )

  els.forEach(parent => {
    const id = parent.data('id') as string
    const index = result[id]
    const inverseIndex = els.length - index - 1
    const y = inverseIndex * (props.spacing + parent.outerHeight())

    parent.position('y', y)
  })
  cy.edges().forEach(edge => { // force update styles
    edge.data('', '')
  })

  if (props.fit) {
    cy.fit()
  }
}
