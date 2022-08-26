import { Core } from 'cytoscape'
import { pick } from 'lodash'

export function simplify(cy: Core) {
  for (const edge of cy.edges().toArray()) {
    const source = edge.source()
    const target = edge.target()

    if (source.data('typingKind') === 'OperatorFactory' && target.data('type') === 'Call') {
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
    }
    if (source.data('typingKind') === 'Operator' && edge.data('label') === 'function' && target.data('type') === 'Call') {
      const sourceData = pick(source.data(), ['identifier', 'module', 'type'])
      const targetData = pick(target.data(), ['type', 'parent'])

      source.incomers('edge').forEach(sourceIncomingEdge => {
        cy.remove(sourceIncomingEdge)
        cy.add({ group: 'edges', data: { ...sourceIncomingEdge.data(), target: target.data('id') }})
      })

      target.data({
        sourceData,
        targetData,
        label: source.data('identifier') || source.data('property'),
        identifier: source.data('identifier'),
        property: source.data('property'),
        type: 'RxJS'
      })
      cy.remove(source)
    }

    if (source.data('typingKind') === 'Builtin' && target.data('type') === 'Member') {
      const sourceData = pick(source.data(), ['identifier', 'module', 'type'])
      const targetData = pick(target.data(), ['type', 'parent'])

      target.data({
        sourceData,
        targetData,
        label: [source.data('identifier'), target.data('property')].join(' '),
        typingKind: 'Builtin',
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
    if (source.data('typingKind') === 'Builtin' && edge.data('label') === 'function' && target.data('type') === 'Call') {
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
}
