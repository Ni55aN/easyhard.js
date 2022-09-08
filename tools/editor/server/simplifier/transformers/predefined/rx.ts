import { Core, EdgeSingular } from 'cytoscape'
import { getUID } from 'easyhard-common'
import { pick } from 'lodash'
import { identifiersToLabel } from '../../utils'
import { Transformer } from '../interface'

export class RxTransformer implements Transformer {
  forward(cy: Core): void {
    cy.nodes()
      .filter(node => node.data('type') === 'ImportDeclaration' && node.data('typingKind') === 'OperatorFactory')
      .forEach(source => {
        source.outgoers('edge')
          .filter((edge: EdgeSingular) => edge.data('label') === 'function' && edge.target().data('type') === 'Call')
          .forEach(edge => {
            const target = edge.target()
            const sourceData = pick(source.data(), ['identifiers', 'module', 'type'])
            const targetData = pick(target.data(), ['type', 'parent'])

            target.data({
              sourceData,
              targetData,
              label: identifiersToLabel(source.data('identifiers')),
              identifiers: source.data('identifiers'),
              type: 'RxJS'
            })
            cy.remove(source)
          })
      })


    cy.nodes()
      .filter(node => node.data('typingKind') === 'Operator' || (node.data('type') === 'ImportDeclaration' && node.data('typingKind') === 'ObservableFactory'))
      .forEach(source => {
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
              .filter(edge => edge.data('type') === 'Argument' && edge.data('label') === 'argument 0')
              .forEach(edge => {
                edge.data('label', '')
                edge.data('type', '')
              })
            incomers.forEach(sourceIncomingEdge => {
              cy.add({ group: 'edges', data: { ...sourceIncomingEdge.data(), id: getUID(), target: target.data('id') }})
            })
          })

        if (outgoers.size() === outgoersCall.size())  cy.remove(source)
      })

  }
  backward(cy: Core): void {
  }
}
