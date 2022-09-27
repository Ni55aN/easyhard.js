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

  test('export', async () => {
    const graph = await fixtureToGraph('export')

    expectGraph(graph).match({
      nodes: [
        { id: 1, type: 'Literal', value: 1 },
        { id: 2, type: 'Export', name: 'a' },
        { id: 3, type: 'ImportDeclaration', identifiers: ['Number'] },
        { id: 4, type: 'Export', name: 'Number' }
      ],
      edges: [
        { source: 1, target: 2 },
        { source: 3, target: 4 },
      ]
    })
  })

  test('export using modifier', async () => {
    const graph = await fixtureToGraph('export-modifier')

    expectGraph(graph).match({
      nodes: [
        { id: 1, type: 'Literal', value: 1 },
        { id: 2, type: 'Literal', value: 2 },
        { id: 3, type: 'Export', name: 'a' },
        { id: 4, type: 'Export', name: 'b' },
        { id: 5, type: 'FunctionDeclaration' },
        { id: 6, type: 'Export', name: 'c' }
      ],
      edges: [
        { source: 1, target: 3 },
        { source: 2, target: 4 },
        { source: 5, target: 6 },
      ]
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

  test('type', async () => {
    const graph = await fixtureToGraph('type')

    expectGraph(graph).match({
      nodes: [
        { id: 1, type: 'UnionType', typeIdentifiers: ['T1'] },
        { id: 2, type: 'NumberType' },
        { id: 3, type: 'StringType' },
        { id: 4, type: 'IntersectionType', typeIdentifiers: ['T2'] },
        { id: 5, type: 'NumberType' },
        { id: 6, type: 'StringType' },
      ],
      edges: [
        { source: 2, target: 1 },
        { source: 3, target: 1 },
        { source: 5, target: 4 },
        { source: 6, target: 4 }
      ]
    })
  })

  test('type function', async () => {
    const graph = await fixtureToGraph('type-function')

    expectGraph(graph).match({
      nodes: [
        { id: 1, type: 'FuncType', typeIdentifiers: ['T'] },
        { id: 5, type: 'ReturnType', parent: 1 },
        { id: 6, type: 'ParameterDeclaration', parent: 1, identifiers: ['a'] },
        { id: 2, type: 'StringType', parent: 1 },
        { id: 7, type: 'ParameterDeclaration', parent: 1, identifiers: ['b'] },
        { id: 3, type: 'BooleanType', parent: 1 },
        { id: 4, type: 'NumberType', parent: 1 },
      ],
      edges: [
        { source: 4, target: 5 },
        { source: 2, target: 6 },
        { source: 3, target: 7 },
      ]
    })
  })

  test('generic type', async () => {
    const graph = await fixtureToGraph('generic-type')

    expectGraph(graph).match({
      nodes: [
        { id: 1, type: 'TypeScope', typeIdentifiers: ['T'] },
        { id: 2, type: 'ReturnType', parent: 1 },
        { id: 3, type: 'GenericParameter', parent: 1, typeIdentifiers: ['M'] },
        { id: 4, type: 'UnionType', parent: 1 },
        { id: 5, type: 'NumberType', parent: 1 },
      ],
      edges: [
        { source: 3, target: 4 },
        { source: 5, target: 4 },
        { source: 4, target: 2 },
      ]
    })
  })

  test('generic function', async () => {
    const graph = await fixtureToGraph('generic-function')

    expectGraph(graph).match({
      nodes: [
        { id: 1, type: 'FunctionDeclaration', identifiers: ['a'] },
        { id: 2, type: 'GenericParameter', parent: 1, typeIdentifiers: ['M'] },
        { id: 3, type: 'ParameterDeclaration', parent: 1, identifiers: ['a'] },
        { id: 4, type: 'Return', parent: 1 },
        { id: 5, type: 'Literal', parent: 1, value: 1 },
      ],
      edges: [
        { source: 2, target: 3 },
        { source: 5, target: 4 },
      ]
    })
  })

  test('generic type function', async () => {
    const graph = await fixtureToGraph('generic-type-function')

    expectGraph(graph).match({
      nodes: [
        { id: 1, type: 'FuncType', typeIdentifiers: ['T'] },
        { id: 2, type: 'ReturnType', parent: 1 },
        { id: 3, type: 'GenericParameter', parent: 1, typeIdentifiers: ['M'] },
        { id: 4, type: 'UnionType', parent: 1 },
        { id: 5, type: 'NumberType', parent: 1 },
        { id: 6, type: 'ParameterDeclaration', parent: 1, identifiers: ['a'] },
      ],
      edges: [
        { source: 3, target: 4 },
        { source: 5, target: 4 },
        { source: 4, target: 2 },
        { source: 3, target: 6 },
      ]
    })
  })
})
