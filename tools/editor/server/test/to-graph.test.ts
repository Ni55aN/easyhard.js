import { describe, test } from '@jest/globals'
import { expectGraph, fixtureToGraph } from './utils';

describe('code to graph', () => {
  test('vars', async () => {
    const graph = await fixtureToGraph('vars')

    expectGraph(graph).match({
      nodes: [
        { type: 'Literal', value: 1, identifiers: ['a'] },
        { type: 'Literal', value: '2', identifiers: ['b'] },
        { type: 'Literal', value: true, identifiers: ['c'] },
        { type: 'Literal', value: null, identifiers: ['d'] }
      ]
    })
  })

  test('function call with return', async () => {
    const graph = await fixtureToGraph('call')

    expectGraph(graph).match({
      nodes: [
        { id: 1, type: 'FunctionDeclaration' },
        { id: 2, type: 'Call' },
        { id: 3, type: 'Return', parent: 1 },
        { id: 4, type: 'Literal', parent: 1, value: 1 },
      ],
      edges: [
        { source: 1, target: 2, label: 'function' },
        { source: 4, target: 3 }
      ]
    })
  })

  test('function return parameter', async () => {
    const graph = await fixtureToGraph('parameter')

    expectGraph(graph).match({
      nodes: [
        { id: 1, type: 'FunctionDeclaration' },
        { id: 2, type: 'ParameterDeclaration', parent: 1, label: 'parameter 0' },
        { id: 3, type: 'NumberType', parent: 1 },
        { id: 4, type: 'Return', parent: 1 },
      ],
      edges: [
        { source: 3, target: 2, label: 'type' },
        { source: 2, target: 4 }
      ]
    })
  })

  test('call with arguments', async () => {
    const graph = await fixtureToGraph('arguments')

    expectGraph(graph).match({
      nodes: [
        { id: 1, type: 'FunctionDeclaration', label: 'a' },
        { id: 2, type: 'Call' },
        { id: 3, type: 'Literal', value: 1 },
        { id: 4, type: 'Literal', value: '2' },
        { id: 5, type: 'Literal', value: true }
      ],
      edges: [
        { source: 3, target: 2, index: 0, type: 'Argument' },
        { source: 4, target: 2, index: 1, type: 'Argument' },
        { source: 5, target: 2, index: 2, type: 'Argument' },
        { source: 1, target: 2, index: -1, label: 'function' },
      ]
    })
  })

  test('import', async () => {
    const graph = await fixtureToGraph('import')

    expectGraph(graph).match({
      nodes: [
        {
          id: 1,
          type: 'ImportDeclaration',
          identifiers: ['Number'],
          typeIdentifiers: ['Number'],
          module: 'easyhard-browser-builtins'
        }
      ],
      edges: []
    })
  })

  test('binary operator', async () => {
    const graph = await fixtureToGraph('binary-operator')

    expectGraph(graph).match({
      nodes: [
        { id: 1, type: 'Literal', value: 1 },
        { id: 2, type: 'BinaryOperator', op: '+' },
        { id: 3, type: 'Literal', value: 2 }
      ],
      edges: [
        { source: 1, target: 2, label: 'left' },
        { source: 3, target: 2, label: 'right' }
      ]
    })
  })

  test('object and member', async () => {
    const graph = await fixtureToGraph('object-member')

    expectGraph(graph).match({
      nodes: [
        { id: 1, type: 'Literal', value: 1 },
        { id: 2, type: 'Object' },
        { id: 3, type: 'Literal', value: 2 },
        { id: 4, type: 'Member', property: 'a', label: 'property a' },
        { id: 5, type: 'Member', property: 'b', label: 'property b' }
      ],
      edges: [
        { source: 1, target: 2, label: 'a' },
        { source: 3, target: 2, label: 'b' },
        { source: 2, target: 4 },
        { source: 2, target: 5 },
      ]
    })
  })

  test('object and member', async () => {
    const graph = await fixtureToGraph('object-member')

    expectGraph(graph).match({
      nodes: [
        { id: 1, type: 'Literal', value: 1 },
        { id: 2, type: 'Object' },
        { id: 3, type: 'Literal', value: 2 },
        { id: 4, type: 'Member', property: 'a', label: 'property a' },
        { id: 5, type: 'Member', property: 'b', label: 'property b' }
      ],
      edges: [
        { source: 1, target: 2, label: 'a' },
        { source: 3, target: 2, label: 'b' },
        { source: 2, target: 4 },
        { source: 2, target: 5 },
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

    expectGraph(graph).match({
      nodes: [
        { id: 1, type: 'FunctionDeclaration', identifiers: ['a'] },
        { id: 2, type: 'FunctionDeclaration', identifiers: ['b'] },
        { id: 3, parent: 1, type: 'Call' },
        { id: 4, parent: 2, type: 'Call' }
      ],
      edges: [
        { source: 2, target: 3, label: 'function' },
        { source: 1, target: 4, label: 'function' }
      ]
    })
  })
})
