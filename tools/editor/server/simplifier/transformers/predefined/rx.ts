import { Core, EdgeSingular, NodeSingular } from 'cytoscape'
import { getUID } from 'easyhard-common'
import { pick } from 'lodash'
import { identifiersToLabel } from '../../utils'
import { Transformer } from '../interface'

export class RxTransformer implements Transformer {
  typingKinds = ['OperatorFactory', 'Operator', 'ObservableFactory']

  private convert(cy: Core, source: NodeSingular) {
    const incomers = source.incomers('edge')
    const outgoers = source.outgoers('edge')

    const outgoersCall = outgoers
      .filter((edge: EdgeSingular) => edge.data('label') === 'function' && edge.target().data('type') === 'Call')

    outgoersCall
      .forEach(edge => {
        const target = edge.target()
        const sourceData = pick(source.data(), ['identifiers', 'module', 'type'])
        const targetData = pick(target.data(), ['type', 'parent'])

        target.data({
          sourceData,
          targetData,
          label: identifiersToLabel(source.data('identifiers')) || source.data('label'),
          type: 'RxJS'
        })
        target.incomers('edge')
          .filter((edge: EdgeSingular) => edge.data('type') === 'Argument' && edge.source().data('typingKind') === 'Observable')
          .forEach(edge => {
            edge.data('label', '')
            edge.data('type', '')
          })
        incomers.forEach(edge => {
          cy.add({ group: 'edges', data: { ...edge.data(), id: getUID(), target: target.data('id') }})
        })
      })

    if (outgoers.size() === outgoersCall.size()) cy.remove(source)
  }

  forward(cy: Core): void {
    const candidates = cy.nodes()
      .filter(node => node.data('type') !== 'Call' && this.typingKinds.includes(node.data('typingKind')))

    candidates.forEach(source => {
      this.convert(cy, source)
    })
    if (!candidates.empty()) {
      this.forward(cy)
    }
  }
  backward(cy: Core): void {
    cy
  }
}
