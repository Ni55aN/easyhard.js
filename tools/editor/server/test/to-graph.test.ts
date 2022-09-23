import { describe, test } from '@jest/globals'
import { expectGraph, fixtureToGraph } from './utils';

describe('code to graph', () => {
  test('vars', async () => {
    const graph = await fixtureToGraph('vars')

    expectGraph(graph).match({
      nodes: [
        { type: 'Literal', value: 1 },
        { type: 'Literal', value: '2' },
        { type: 'Literal', value: true },
        { type: 'Literal', value: null }
      ]
    })
  })

  test('recursion', async () => {
    const graph = await fixtureToGraph('recursion')

    expectGraph(graph).match({
      nodes: [
        { id: 1, type: 'Call', parent: 2 },
        { id: 2, type: 'FunctionDeclaration' }
      ],
      edges: [
        { source: 2, target: 1, label: 'function' }
      ]
    })
  })

  test('cyclic', async () => {
    const graph = await fixtureToGraph('cyclic')

    console.log(JSON.stringify(graph.json()))

    expectGraph(graph).match({
      nodes: [
        {
          id: 1,
          type: 'FunctionDeclaration',
          identifiers: ['a']
        },
        {
          id: 2,
          type: 'FunctionDeclaration',
          identifiers: ['b']
        },
        {
          id: 3,
          parent: 1,
          type: 'Call'
        },
        {
          id: 4,
          parent: 2,
          type: 'Call'
        }
      ],
      edges: [
        {
          source: 2,
          target: 3,
          label: 'function',
        },
        {
          source: 1,
          target: 4,
          label: 'function',
        }
      ]
    })
  })
})
