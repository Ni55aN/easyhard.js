import cytoscape, { Core, ElementDefinition, CollectionReturnValue, CollectionArgument } from 'cytoscape'

export class HiddenPreprocessing {
  local: Core

  constructor(private elementsGetter: () => CollectionReturnValue) {
    this.local = cytoscape()
  }

  add(eles: ElementDefinition[]) {
    const added = this.local.add(eles)

    const internalNodes = this.local.filter(n => n.isNode() && n.data('internal'))
    const withoutInternal = added.subtract(internalNodes).subtract(internalNodes.connectedEdges())

    const nodesWithInternalOutgoers = added
      .filter(n => n.isNode() && !n.data('internal') && n.outgoers().filter(n => n.isNode() && n.data('internal')).length > 0)
    const nonInternalNodesPairs = nodesWithInternalOutgoers.map(source => {
      const bfs = this.local.elements().bfs({
        roots: source,
        visit(v) {
          if (!source.contains(v) && !v.data('internal')) {
            return true
          }
        },
        directed: false
      })
      const target = bfs.found.first()
      const lastEdge = bfs.path.filter(el => el.isEdge()).last()

      return {
        source,
        lastEdge,
        target
      }
    })
    const edges = nonInternalNodesPairs.filter(({ target }) => target.nonempty()).map(({ source, lastEdge, target }) => {
      return <ElementDefinition>{
        group: 'edges',
        data: {
          ...lastEdge.data(),
          source: source.id(),
          target: target.id()
        }
      }
    })

    return [
      ...withoutInternal.jsons() as unknown as ElementDefinition[],
      ...edges
    ]
  }

  remove(eles: CollectionArgument) {
    this.local.remove(eles)
    return eles
  }
}
