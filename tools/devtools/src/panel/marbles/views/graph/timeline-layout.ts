import cytoscape from 'cytoscape'

function sortByReferences(a: cytoscape.NodeSingular, b: cytoscape.NodeSingular) {
  const currentId: string = a.data('id')
  const currentReferencesIds = a.children().incomers().parents().map(p => p.data('id'))
  const nextId: string = b.data('id')
  const nextReferencesIds = b.children().incomers().parents().map(p => p.data('id'))

  console.log(currentId, nextId, currentReferencesIds, nextReferencesIds)

  return nextReferencesIds.includes(currentId) && !currentReferencesIds.includes(nextId) ? -1 : 1
}

export function timelineLayout(cy: cytoscape.Core, props: { fit: boolean, field: string, spacing: number, start: number, scale: number }) {
  cy.nodes().forEach(node => {
    const x = (+node.data(props.field) - props.start) * props.scale
    console.log('parent y ', node.data('id'), x)
    node.position({ x, y: 0 })
  })
  const els = cy.elements(':parent').map((parent: cytoscape.NodeSingular) => {
    return parent
  })
  els.sort(sortByReferences)

  els.forEach((parent, i) => {
    const y = i * (props.spacing + parent.outerHeight())
    console.log('parent y ', parent.position('x'), parent.data('id'), y)

    parent.position('y', y)
  })
  if (props.fit) {
    cy.fit()
  }
}
