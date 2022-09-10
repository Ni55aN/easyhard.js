import { Core, EdgeSingular, NodeSingular } from 'cytoscape'
import { getUID } from 'easyhard-common'
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

        target.data({
          sourceData: { ...source.data() },
          targetData: { ...target.data() },
          label: identifiersToLabel(source.data('identifiers')) || source.data('label'),
          type: 'RxJS'
        })
        target.incomers('edge')
          .filter((edge: EdgeSingular) => edge.data('type') === 'Argument' && edge.source().data('typingKind') === 'Observable')
          .forEach(edge => {
            edge.data('label', '')
            edge.data('type', 'RxPipe')
            edge.data('index', -1)
          })
        incomers.forEach(edge => {
          cy.add({ group: 'edges', data: { ...edge.data(), id: getUID(), target: target.data('id') }})
        })
      })

    if (outgoers.size() === outgoersCall.size()) cy.remove(source)
  }

  forward(cy: Core): void {
    const candidates = cy.nodes()
      .filter(node => ['ImportDeclaration', 'RxJS'].includes(node.data('type')) && this.typingKinds.includes(node.data('typingKind')))

    candidates.forEach(source => {
      this.convert(cy, source)
    })
    if (!candidates.empty()) {
      this.forward(cy)
    }
  }

  private recover(cy: Core, node: NodeSingular) {
    const sourceData = node.data('sourceData')
    const targetData = node.data('targetData')

    node.data(targetData)

    if (cy.getElementById(sourceData.id).empty()) cy.add({ group: 'nodes', data: sourceData })

    if (sourceData.type === 'RxJS') {
      node.incomers('edge')
        .filter((edge: EdgeSingular) => edge.data('type') !== 'RxPipe')
        .forEach(edge => {
          cy.remove(edge)
          cy.add({ group: 'edges', data: {
            ...edge.data(),
            target: sourceData.id
          }})
        })
    }

    cy.add({ group: 'edges', data: {
      id: getUID(),
      source: sourceData.id,
      target: node.id(),
      label: 'function',
      index: -1
    }})

  }

  backward(cy: Core): void {
    const candidates = cy.nodes().filter(node => node.data('type') === 'RxJS')

    candidates.forEach(node => {
      this.recover(cy, node)
    })

    if (!candidates.empty()) {
      this.backward(cy)
    }
  }
}
