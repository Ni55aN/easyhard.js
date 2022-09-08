import { Core, EdgeSingular, NodeSingular } from 'cytoscape'
import { getUID } from 'easyhard-common'
import { Transformer } from '../interface'

export class ArgumentsTransformer implements Transformer {
  forward(cy: Core): void {
    cy.nodes()
      .forEach(target => {
        target.incomers('edge')
          .filter(edge => edge.data('type') === 'Argument')
          .forEach(edge => {
            this.createPort(cy, target, edge)
          })
      })
  }
  backward(cy: Core): void {
    cy.nodes()
      .forEach(target => {
        target.children()
          .filter(node => node.data('type') === 'Argument')
          .forEach(node => {
            const edge = node.incomers('edge').first()
            cy.remove(edge)
            cy.add({ group: 'edges', data: {
              ...edge.data(),
              port: undefined,
              target: target.data('id')
            }})
            cy.remove(node)
          })
      })
  }

  createPort(cy: Core, target: NodeSingular, edge: EdgeSingular) {
    const index = edge.data('index')

    if (edge.data('type') !== 'Argument') return
    if (edge.data('port')) return
    if (!Number.isFinite(index)) throw new Error('cannot extract index')

    const argNode = cy.add({ group: 'nodes', data: {
      id: getUID(),
      parent: target.data('id'),
      type: 'Argument',
      index
    }})
    cy.remove(edge)
    cy.add({ group: 'edges', data: {
      ...edge.data(),
      port: true,
      target: argNode.data('id')
    }})
  }
}
