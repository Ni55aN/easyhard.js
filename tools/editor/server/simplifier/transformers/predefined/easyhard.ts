import { Core, EdgeSingular } from 'cytoscape'
import { getUID } from 'easyhard-common'
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
              sourceData: { ...source.data() },
              argument0Data: argument0 && { ...argument0.data() },
              argument1Data: argument1 && { ...argument1.data() },
              targetData: { ...target.data() },
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
                }
              })
            cy.remove(source)
          })
      })
  }
  backward(cy: Core): void {
    cy.nodes()
      .filter(node => node.data('type') === 'EasyhardElement')
      .forEach(node => {
        const sourceData = node.data('sourceData')
        const targetData = node.data('targetData')
        const argument0 = node.data('argument0Data')
        const argument1 = node.data('argument1Data')

        if (argument0) cy.add({
          group: 'nodes',
          data: argument0
        })
        if (argument1) cy.add({
          group: 'nodes',
          data: argument1
        })
        node.data(targetData)
        if (cy.getElementById(sourceData.id).empty()) cy.add({
          group: 'nodes',
          data: sourceData
        })

        node.incomers('edge')
          .forEach((edge: EdgeSingular) => {
            if (edge.data('type') !== 'Argument') {
              cy.remove(edge)
              cy.add({ group: 'edges', data: { ...edge.data(), type: undefined, target: argument1.id }})
            }
          })

        cy.add({
          group: 'edges',
          data: {
            id: getUID(),
            source: sourceData.id,
            target: node.id(),
            label: 'function',
            index: 0
          }
        })

        if (argument0) {
          cy.add({
            group: 'edges',
            data: {
              id: getUID(),
              source: argument0.id,
              target: node.id(),
              label: 'argument 0',
              index: 0
            }
          })
        }
        if (argument1) {
          cy.add({
            group: 'edges',
            data: {
              id: getUID(),
              source: argument1.id,
              target: node.id(),
              label: 'argument 1',
              index: 1
            }
          })
        }
      })

  }
}
