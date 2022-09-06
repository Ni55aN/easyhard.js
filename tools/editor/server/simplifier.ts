import { Core, EdgeSingular, NodeSingular } from 'cytoscape'
import { getUID } from 'easyhard-common'
import { pick } from 'lodash'

function createPort(cy: Core, target: NodeSingular, edge: EdgeSingular) {
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

export function simplify(cy: Core) {
  cy.nodes()
    .filter(node => node.data('type') === 'ImportDeclaration' && node.data('typingKind') === 'OperatorFactory')
    .forEach(source => {
      source.outgoers('edge')
        .filter((edge: EdgeSingular) => edge.data('label') === 'function' && edge.target().data('type') === 'Call')
        .forEach(edge => {
          const target = edge.target()
          const sourceData = pick(source.data(), ['identifier', 'module', 'type'])
          const targetData = pick(target.data(), ['type', 'parent'])

          target.data({
            sourceData,
            targetData,
            label: source.data('identifier'),
            identifier: source.data('identifier'),
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
          const sourceData = pick(source.data(), ['identifier', 'module', 'type'])
          const targetData = pick(target.data(), ['type', 'parent'])

          target.data({
            sourceData,
            targetData,
            label: source.data('identifier') || source.data('label'),
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
              } else {
                createPort(cy, target, targetIncomingEdge)
              }
            })
          cy.remove(source)
        })
    })

  for (const edge of cy.edges().toArray()) {
    const source = edge.source()
    const target = edge.target()

    if (source.data('type') === 'ImportDeclaration' && target.data('type') === 'Member') {
      const sourceData = pick(source.data(), ['identifier', 'module', 'type'])
      const targetData = pick(target.data(), ['type', 'parent'])

      target.data({
        sourceData,
        targetData,
        label: [source.data('identifier'), target.data('property')].join(' '),
        type: 'Snippet'
      })
      cy.remove(source)
    }
    if (source.data('type') === 'Member' && edge.data('label') === 'function' && target.data('type') === 'Call') {
      const sourceData = pick(source.data(), ['property', 'type', 'parent'])
      const targetData = pick(target.data(), ['type', 'parent'])

      source.incomers('edge').forEach(sourceIncomingEdge => {
        cy.remove(sourceIncomingEdge)
        cy.add({ group: 'edges', data: { ...sourceIncomingEdge.data(), target: target.data('id') }})
      })

      target.data({
        sourceData,
        targetData,
        label: 'call ' + source.data('property'),
        type: 'CallMember'
      })
      cy.remove(source)
    }
    if (source.data('type') === 'ImportDeclaration' && edge.data('label') === 'function' && target.data('type') === 'Call') {
      const sourceData = pick(source.data(), ['identifier', 'module', 'type'])
      const targetData = pick(target.data(), ['type', 'parent'])

      target.data({
        sourceData,
        targetData,
        label: source.data('identifier'),
        type: 'Snippet'
      })
      cy.remove(source)
    }
  }

  cy.nodes()
    .forEach(target => {
      target.incomers('edge')
        .filter(edge => edge.data('type') === 'Argument')
        .forEach(edge => {
          createPort(cy, target, edge)
        })
    })
}
