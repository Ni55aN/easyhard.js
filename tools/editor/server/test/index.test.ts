import { describe, expect, test } from '@jest/globals'
import { expectGraph, fixtureToGraph } from './utils';

describe('fixtures', () => {
  test('vars', async () => {
    const graph = await fixtureToGraph('vars')

    expect(graph.nodes()).toHaveLength(4)
    expect(graph.$('node[type="Literal"]').length).toEqual(4)

    expectGraph(graph).toHaveNode({ type: 'Literal', value: 1 })
    expectGraph(graph).toHaveNode({ type: 'Literal', value: '2' })
    expectGraph(graph).toHaveNode({ type: 'Literal', value: true })
    expectGraph(graph).toHaveNode({ type: 'Literal', value: null })
  })
});
