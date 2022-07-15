
import { CollectionReturnValue, Core, NodeSingular } from 'cytoscape'
import { predecessorsUntil, successorsUntil } from '../shared/cytoscape/collection'
import * as selectors from './selectors'


export enum TogglerKey {
  ObservablesHidden = 'observablesHidden',
  ParentsHidden = 'parentsHidden',
  ChildrenHidden = 'childrenHidden'
}

function toggleVisibility(target: CollectionReturnValue | NodeSingular, hidden: boolean, toggle?: (id: string, hidden: boolean) => void) {
  const displayValue = hidden ? 'none' : 'element'

  if (target.css('display') === displayValue) return

  target.nodes().forEach(node => {
    toggle && toggle(node.data('id') as string, hidden)
  })

  target.css('display', displayValue)
  target.connectedEdges().css('display', displayValue)
}
function isObservableOrphan(n: NodeSingular) {
  const s = n.successors(selectors.dom)
  const alreadyHidden = s.filter(n => n.data(TogglerKey.ObservablesHidden) || n.css('display') === 'none')
  const hiddenParentObservables = n.successors(selectors.observable).filter(n => n.data(TogglerKey.ParentsHidden)).successors(selectors.dom)
  const withoutHiddenSubgraph = s.subtract(alreadyHidden).subtract(alreadyHidden.successors(selectors.dom)).subtract(hiddenParentObservables)

  return withoutHiddenSubgraph.length === 0
}

export function toggleObservables(cy: Core, node: CollectionReturnValue | NodeSingular, hidden: boolean, toggle?: (id: string, hidden: boolean) => void) {
  predecessorsUntil(cy, node, selectors.observable, n => {
    const isOrphan = isObservableOrphan(n)
    if (hidden && isOrphan) {
      toggleVisibility(n, true, toggle)
      return true
    } else if (!isOrphan) {
      toggleVisibility(n, false, toggle)
      return true
    }
    return false
  })
}

export function toggleSubGraph(cy: Core, node: NodeSingular, hidden: boolean, toggle?: (id: string, hidden: boolean) => void) {
  if (!['node', 'eh-node', 'fragment'].includes(node.data('type') as string)) throw new Error('cannot toggle non-element nodes')

  const successors = successorsUntil(cy, node, selectors.dom, el => !el.data(TogglerKey.ChildrenHidden))

  toggleVisibility(successors, hidden, toggle)
  toggleObservables(cy, successors, hidden, toggle)
}
