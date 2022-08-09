import _ from 'lodash';
import { Node, Connection } from 'rete';
import { Editor } from '../types';
import { INestedNodeControl, NestedNode } from './controls';

export function getNodes(node: Node, type: 'input' | 'output' = 'output') {
  const nodes: Node[] = [];

  for (const connection of getConnections(node, type)) {
    nodes.push(connection[type === 'input' ? 'output' : 'input'].node as Node);
  }

  return nodes;
}

export function getConnections(node: Node, type: 'input' | 'output' = 'output') {
  const connections: Connection[] = [];
  const key = `${type}s` as 'inputs' | 'outputs';

  for (const io of node[key].values()) {
    for (const connection of io.connections.values()) {
      connections.push(connection)
    }
  }
  return connections
}

export function arrangeRoot(editor: Editor) {
  const startNode = editor.origin.nodes.filter((n: NestedNode) => !n.belongsTo)[0]

  if (startNode) editor.arrange(startNode, {
    skip: (node: NestedNode) => {
      return Boolean(node.belongsTo)
    },
    substitution: {
      input: (currentNode) => {
        if (currentNode.name === 'Function') {
          const nestedNodes = editor.origin.nodes.filter((n: NestedNode) => n.belongsTo === currentNode)
          const outerInputNodes = _.flatten(nestedNodes.map(n => getNodes(n, 'input'))).filter((n: NestedNode) => n.belongsTo !== n)

          return outerInputNodes
        }
        return undefined
      },
      output: (n) => {
        return getNodes(n, 'output').map((n: NestedNode) => n.belongsTo || n)
      }
    }
  })
}

export function arrangeSubnodes(node: NestedNode, editor: Editor, nodes: NestedNode[]) {
  nodes.forEach(nestedNode => {
    editor.arrange(nestedNode, {
      skip: (n: NestedNode) => {
        return n.belongsTo !== node
      }
    })
  })
  ;(node.controls.get('area') as INestedNodeControl)?.adjustPlacement()
}
