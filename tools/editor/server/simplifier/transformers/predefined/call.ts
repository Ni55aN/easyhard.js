import { Core } from 'cytoscape';
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
  }

}
