import 'regenerator-runtime/runtime'
import { Input, Node, NodeEditor, Output, Engine } from 'rete'
import ReactRenderPlugin from 'rete-react-render-plugin';
import ConnectionPlugin from 'rete-connection-plugin'
import AreaPlugin from 'rete-area-plugin'
import ContextMenuPlugin from 'rete-context-menu-plugin'
import AutoArrangePlugin from 'rete-auto-arrange-plugin'
import { INestedNodeControl, NestedNode } from './controls'
import {
  VariableDeclaration, ParameterDeclaration, Call,
  Member, Return,ObjectComp, ImportDeclaration,
  FunctionDeclaration, BinaryOperator, Conditional
} from './components'
import { Component } from './components/base';

export { Component, Input, Node, NodeEditor, Output } from 'rete'
export * from './utils'
export * from './controls'

const components: {[key: string]: Component} = {
  VariableDeclaration: new VariableDeclaration(),
  ParameterDeclaration: new ParameterDeclaration(),
  Call: new Call(),
  Member: new Member(),
  Return: new Return(),
  Object: new ObjectComp(),
  FunctionDeclaration: new FunctionDeclaration(() => components),
  ImportDeclaration: new ImportDeclaration(),
  BinaryOperator: new BinaryOperator(),
  Conditional: new Conditional()
}

export async function createEditor(container: HTMLElement) {

  const editor = new NodeEditor('demo@0.1.0', container);
  editor.use(ConnectionPlugin);
  editor.use(ReactRenderPlugin);
  editor.use(AreaPlugin);

  const mouse: [number, number] = [0, 0];

  editor.on('mousemove', ({ x, y }) => {
    mouse[0] = x;
    mouse[1] = y;
  });

  editor.use(ContextMenuPlugin, {
    nodeItems: (node: Node) => {
      const position: [number, number] = [...mouse]
      if (node.name === 'Function') {
        return {
          'Component': Object.values(components).reduce((obj, item) => {
            if (item.scope === 'root') return obj
            return { ...obj, [item.name]() {
              addNode(item, position, {}).then(createdNode => {
                (createdNode as NestedNode).belongsTo = node
                ;(node.controls.get('area') as INestedNodeControl).adjustPlacement()
                editor.view.updateConnections({ node })
              })
            }}
          }, {})
        }
      }
      return {}
    },
    allocate: (component: Component) => {
      return component.scope === 'any' || component.scope === 'root' ? [] : null
    }
  });
  editor.use(AutoArrangePlugin, { margin: { x: 50, y: 50 }, depth: 0 }); // depth - max depth for arrange (0 - unlimited)


  const engine = new Engine('demo@0.1.0');

  Object.values(components).map(c => {
    editor.register(c);
    engine.register(c);
  });

  editor.view.resize();

  editor.trigger('process');

  async function addNode(component: Component, position: [number, number], data: any): Promise<NestedNode> {
    const node = await component.createNode(data);

    node.position = [...position];
    editor.addNode(node);

    return node
  }

  return {
    origin: editor,
    components,
    arrange(node: Node, { skip, substitution }: { skip?: (n: Node) => boolean, substitution?: { input: (n: Node, ns: Node[]) => undefined | Node[], output: (n: Node, ns: Node[]) => undefined | Node[] } }) {
      editor.trigger('arrange' as any, { node, skip, substitution });
      AreaPlugin.zoomAt(editor)
    },
    addNode,
    connect(output: Output, input: Input) {
      editor.connect(output, input)
    }
  }
}

