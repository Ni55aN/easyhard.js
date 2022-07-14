
import { CollectionReturnValue, CollectionStyle, Core, NodeSingular } from 'cytoscape'
import { predecessorsUntil, successorsUntil } from '../shared/cytoscape/collection'
import * as selectors from './selectors'


export enum TogglerKey {
  ObservablesHidden = 'observablesHidden',
  ParentsHidden = 'parentsHidden',
  ChildrenHidden = 'childrenHidden'
}

function toggleVisibility(target: CollectionStyle, hidden: boolean) {
  const displayValue = hidden ? 'none' : 'element'

  target.css('display', displayValue)
}
function isObservableOrphan(n: NodeSingular) {
  const s = n.successors(selectors.dom)
  const alreadyHidden = s.filter(n => n.data(TogglerKey.ObservablesHidden) || n.css('display') === 'none')
  const hiddenParentObservables = n.successors(selectors.observable).filter(n => n.data(TogglerKey.ParentsHidden)).successors(selectors.dom)
  const withoutHiddenSubgraph = s.subtract(alreadyHidden).subtract(alreadyHidden.successors(selectors.dom)).subtract(hiddenParentObservables)

  return withoutHiddenSubgraph.length === 0
}

export function toggleObservables(cy: Core, node: CollectionReturnValue | NodeSingular, hidden: boolean) {
  predecessorsUntil(cy, node, selectors.observable, n => {
    const isOrphan = isObservableOrphan(n)
    if (hidden && isOrphan) {
      toggleVisibility(n, true)
      return true
    } else if (!isOrphan) {
      toggleVisibility(n, false)
      return true
    }
    return false
  })
}

export function toggleSubGraph(cy: Core, node: NodeSingular, hidden: boolean) {
  if (!['node', 'eh-node', 'fragment'].includes(node.data('type') as string)) throw new Error('cannot toggle non-element nodes')

  const successors = successorsUntil(cy, node, selectors.dom, el => !el.data(TogglerKey.ChildrenHidden))

  toggleVisibility(successors, hidden)
  toggleObservables(cy, successors, hidden)
}
