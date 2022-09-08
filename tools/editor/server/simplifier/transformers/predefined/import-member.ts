import { Core } from 'cytoscape';
import { Transformer } from '../interface'
import { identifiersToLabel } from '../../utils'
import { getUID } from 'easyhard-common';

export class ImportMemberTransformer implements Transformer {
  forward(cy: Core): void {
    for (const edge of cy.edges().toArray()) {
      const source = edge.source()
      const target = edge.target()

      if (source.data('type') === 'ImportDeclaration' && target.data('type') === 'Member') {
        target.data({
          sourceData: { ...source.data() },
          targetData: { ...target.data() },
          label: [identifiersToLabel(source.data('identifiers')), target.data('property')].join(' '),
          type: 'Snippet',
          snippetType: 'member'
        })
        cy.remove(source)
      }
    }
  }
  backward(cy: Core): void {
    cy.nodes()
      .filter(node => node.data('type') === 'Snippet' && node.data('snippetType') === 'member')
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
            index: 0
          }
        })
        node.data(node.data('targetData'))
      })
  }

}
