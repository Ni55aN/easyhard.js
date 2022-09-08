import { Core, EdgeSingular } from 'cytoscape'
import { Transformer } from '../interface'

export class EasyhardTransformer implements Transformer {
  forward(cy: Core): void {
    cy.nodes()
      .filter(node => node.data('type') === 'ImportDeclaration' && node.data('typingKind') === 'EasyhardH')
      .forEach(source => {
        source.outgoers('edge')
          .filter((edge: EdgeSingular) => edge.data('label') === 'function' && edge.target().data('type') === 'Call')
          .forEach(edge => {
            const target = edge.target()
            const argument0 = target.incomers('edge')
              .filter((edge: EdgeSingular) => edge.data('type') === 'Argument' && edge.data('label') === 'argument 0' && edge.source().data('type') === 'Literal')
              .source()
            const argument1 = target.incomers('edge')
              .filter((edge: EdgeSingular) => edge.data('type') === 'Argument' && edge.data('label') === 'argument 1' && edge.source().data('type') === 'Object')
              .source()

            target.data({
              label: argument0?.data('label') || 'element',
              type: 'EasyhardElement'
            })

            argument1?.incomers('edge').forEach(argument1Edge => {
              cy.remove(argument1Edge)
              cy.add({ group: 'edges', data: { ...argument1Edge.data(), type: undefined, target: target.data('id') }})
            })

            argument0 && cy.remove(argument0)
            argument1 && cy.remove(argument1)

            target.incomers('edge')
              .filter(targetIncomingEdge => targetIncomingEdge.data('type') === 'Argument')
              .forEach(targetIncomingEdge => {
                const label = targetIncomingEdge.data('label')
                const index = +label.split(' ')[1]

                if (index === 0) {
                  targetIncomingEdge.data('label', `tag`)
                  targetIncomingEdge.removeData('type')
                } else if (index === 1) {
                  targetIncomingEdge.data('label', `props`)
                  targetIncomingEdge.removeData('type')
                }/* else {
                  createPort(cy, target, targetIncomingEdge)
                }*/
              })
            cy.remove(source)
          })
      })
  }
  backward(cy: Core): void {
  }
}
