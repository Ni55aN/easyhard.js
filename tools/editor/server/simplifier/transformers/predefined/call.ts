import { Core } from 'cytoscape';
import { getUID } from 'easyhard-common';
import { Transformer } from '../interface'

export class CallTransformer implements Transformer {
  forward(cy: Core): void {
    for (const edge of cy.edges().toArray()) {
      const source = edge.source()
      const target = edge.target()

      if (['ImportDeclaration', 'Member'].includes(source.data('type')) && edge.data('label') === 'function' && target.data('type') === 'Call') {
        source.incomers('edge').forEach(sourceIncomingEdge => {
          cy.remove(sourceIncomingEdge)
          cy.add({ group: 'edges', data: { ...sourceIncomingEdge.data(), target: target.data('id') }})
        })

        target.data({
          sourceData: { ...source.data() },
          targetData: { ...target.data() },
          label: 'call ' + source.data('label'),
          type: 'Snippet',
          snippetType: 'call'
        })
        cy.remove(source)
      }
    }
  }

  backward(cy: Core): void {
    cy.nodes()
      .filter(node => node.data('type') === 'Snippet' && node.data('snippetType') === 'call')
      .forEach(node => {
        const existing = cy.getElementById(node.data('sourceData').id)
        const source = !existing.empty() ? existing : cy.add({
          group: 'nodes',
          data: node.data('sourceData')
        })
        cy.add({
          group: 'edges',
          data: {
            id: getUID(),
            source: source.id(),
            target: node.id(),
            label: 'function',
            index: -1
          }
        })
        const incomers = node.incomers('edge').filter(edge => !edge.data('label'))

        node.data(node.data('targetData'))
        incomers.forEach(edge => {
          cy.remove(edge)
          cy.add({ group: 'edges', data: { ...edge.data(), target: source.data('id') }})
        })
      })
  }
}
