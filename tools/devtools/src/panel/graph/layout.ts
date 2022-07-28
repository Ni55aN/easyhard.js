import cytoscape, { Core, EdgeSingular } from 'cytoscape'
import dagre from 'cytoscape-dagre'
import debounce from 'lodash/debounce'
import { getTypeCategory } from '.'

/* eslint-disable @typescript-eslint/no-unsafe-argument */
cytoscape.use(dagre)
/* eslint-enable @typescript-eslint/no-unsafe-argument */

export function layoutOptions(fit = false) {
  return {
    name: 'dagre',
    rankDir: 'LR',
    ranker: 'tight-tree',
    fit,
    spacingFactor: 0.56,
    minLen(edge: EdgeSingular) {
      const nodes = edge.connectedNodes().map((n: any) => n.data())
      const sourceType = getTypeCategory(nodes[0].type)
      const targetType = getTypeCategory(nodes[1].type)

      if ((sourceType === 'observable') !== (targetType === 'observable')) {
        return 6
      }
      if (edge.data('type') === 'argument') {
        return 2
      }

      return 1
    }
  }
}

export const layout = debounce(async function (cy: Core, fit = false) {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  const layoutInstance = cy.elements().makeLayout(layoutOptions(fit))

  const onStop = layoutInstance.promiseOn('layoutstop')

  layoutInstance.run()
  await onStop
}, 50)
