import cytoscape from 'cytoscape'
import { dfsTopSort } from './dfs-sort'

describe('DFS sorting', () => {
  it('basic', () => {
    const cy = cytoscape({
      elements: [
        { group: 'nodes', data: { id: '1' } },
        { group: 'nodes', data: { id: '2' } },
        { group: 'nodes', data: { id: '3' } },
        { group: 'nodes', data: { id: '4' } },
        { group: 'nodes', data: { id: '5' } },
        { group: 'edges', data: { source: '2', target: '1', id: '2_1'}},
        { group: 'edges', data: { source: '2', target: '3', id: '2_3'}},
        { group: 'edges', data: { source: '2', target: '4', id: '2_4'}},
        { group: 'edges', data: { source: '5', target: '3', id: '5_3'}}
      ]
    })

    const result = dfsTopSort(
      () => cy.nodes().map(n => n.data('id')),
      id => cy.getElementById(id).incomers('node').map(n => n.id())
    )
    const sorted = Object.entries(result)
      .sort((a, b) => a[1] - b[1])
      .reverse()
      .map(a => a[0])

    expect(sorted).toEqual(['2', '1', '5', '3', '4'])
  })
})
