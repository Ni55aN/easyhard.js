import cytoscape from 'cytoscape'

function sortByReferences(a: cytoscape.NodeSingular, b: cytoscape.NodeSingular) {
  const currentId: string = a.data('id')
  const currentReferencesIds = a.children().incomers().parents().map(p => p.data('id'))
  const nextId: string = b.data('id')
  const nextReferencesIds = b.children().incomers().parents().map(p => p.data('id'))

  return nextReferencesIds.includes(currentId) && !currentReferencesIds.includes(nextId) ? -1 : 1
}

export function timelineLayout(cy: cytoscape.Core, props: { fit: boolean, field: string, spacing: number, start: number, scale: number }) {
  cy.nodes().forEach(node => {
    const x = (+node.data(props.field) - props.start) * props.scale

    node.position({ x, y: 0 })
  })
  const els = cy.elements(':parent').map((parent: cytoscape.NodeSingular) => {
    return parent
  })
  els.sort(sortByReferences)

  els.forEach((parent, i) => {
    const y = i * (props.spacing + parent.outerHeight())

    parent.position('y', y)
  })
  cy.edges().forEach(edge => { // force update styles
    edge.data('', '')
  })

  if (props.fit) {
    cy.fit()
  }
}
