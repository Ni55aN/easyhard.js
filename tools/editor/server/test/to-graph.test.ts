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
})
