import cytoscape, { Core, EdgeSingular } from 'cytoscape'
import dagre from 'cytoscape-dagre'

/* eslint-disable @typescript-eslint/no-unsafe-argument */
cytoscape.use(dagre)
/* eslint-enable @typescript-eslint/no-unsafe-argument */

export async function layout(cy: Core, fit = false) {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  const layoutInstance = cy.elements().makeLayout({
    name: 'dagre',
    rankDir: 'LR',
    ranker: 'tight-tree',
    fit,
    spacingFactor: 0.56,
    minLen(edge: EdgeSingular) {
      const nodes = edge.connectedNodes().map((n: any) => n.data())

      if ((nodes[0].type === 'observable') !== (nodes[1].type === 'observable')) {
        return 6
      }
      if (edge.data('type') === 'argument') {
        return 2
      }

      return 1
    }
  } as any)

  const onStop = layoutInstance.promiseOn('layoutstop')

  layoutInstance.run()
  await onStop
}
