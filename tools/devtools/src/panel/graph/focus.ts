import cytoscape from 'cytoscape'

export function focusNode(cy: cytoscape.Core, id: string) {
  const element = cy.getElementById(id)
  const delay = 500

  cy.stop()
  element
    .delay(delay)
    .animate({ style: { borderWidth: 0 }}, { easing: 'ease-out', duration: 300 })
    .animate({ style: { borderWidth: 1 }}, { easing: 'ease-in', duration: 200 })
  cy.animate({
    fit: {
      eles: element,
      padding: Math.min(cy.height(), cy.width()) * 0.42
    },
    duration: delay
  })
}
