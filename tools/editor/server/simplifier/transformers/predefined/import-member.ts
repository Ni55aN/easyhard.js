import { Core } from 'cytoscape';
import { Transformer } from '../interface'
import { identifiersToLabel } from '../../utils'

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
  }

}
