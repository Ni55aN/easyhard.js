import 'regenerator-runtime/runtime'
import * as React from 'react'
import { $ } from 'easyhard'
import _ from 'lodash'
import Rete, { Connection, Control, Input, Node, NodeEditor, Output } from 'rete'
// import VueRenderPlugin from 'rete-vue-render-plugin'
import ReactRenderPlugin, { Node as ReactNode, Socket as ReactSocket, Control as ReactControl } from 'rete-react-render-plugin';
import ConnectionPlugin from 'rete-connection-plugin'
import AreaPlugin from 'rete-area-plugin'
import ContextMenuPlugin from 'rete-context-menu-plugin'
import AutoArrangePlugin from 'rete-auto-arrange-plugin'
import { useRef } from 'react';
import { NodeView } from 'rete/types/view/node';
import { Subject, Subscription } from 'rxjs'

export { Component, Input, Node, NodeEditor, Output } from 'rete'

const varSocket = new Rete.Socket('Variable');
const valSocket = new Rete.Socket('Value');
const funcSocket = new Rete.Socket('Func');
const objSocket = new Rete.Socket('Obj');
const anySocket = new Rete.Socket('Any');

varSocket.combineWith(objSocket)

anySocket.combineWith(varSocket)
anySocket.combineWith(valSocket)
anySocket.combineWith(funcSocket)
anySocket.combineWith(objSocket)
varSocket.combineWith(anySocket)
valSocket.combineWith(anySocket)
funcSocket.combineWith(anySocket)
objSocket.combineWith(anySocket)


type Scope = 'any' | 'root' | (new () => Component)
abstract class Component extends Rete.Component {
    scope: Scope = 'any'
}

type TextControlComponentProps = {
  value: string | $<string>
  id: string
  readonly: boolean
  putData: (...arg: any[]) => void
  emitter: NodeEditor
}

class TextControlComponent extends React.Component<TextControlComponentProps> {
  state: { value?: string } = {};
  sub!: Subscription

  componentWillUnmount() {
    if (this.sub) this.sub.unsubscribe()
  }
  componentDidMount() {
    const { value } = this.props
    if (value instanceof Subject) {
      this.sub = value.subscribe(v => {
        this.setState({
          value: v
        });
      })
    } else {
      this.setState({
        value: this.props.value
      });
      this.props.putData(this.props.id, this.props.value);
    }
  }
  onChange(event: any) {
    const next = event.target.value
    const { value } = this.props
    if (value instanceof Subject) {
      value.next(next)
    } else {
      this.props.putData(this.props.id, next);
      this.props.emitter.trigger("process");
      this.setState({
        value: next
      });
    }
  }

  render() {
    return (
      <input value={this.state.value} onChange={this.onChange.bind(this)} />
    );
  }
}

export class TextControl extends Rete.Control {
  render: string
  component: any
  props: TextControlComponentProps
  constructor(emitter: NodeEditor, key: string, value: string | $<string>, readonly: boolean, events: { change?: () => void } = {}) {
    super(key);
    this.render = "react";
    this.component = TextControlComponent;
    this.props = {
      emitter,
      id: key,
      value,
      readonly,
      putData: (key: any, data: any) => {
        this.putData.bind(this)(key, data)
        events.change && events.change()
      }
    };
  }
}

type ButtonProps = { label: string, click?: () => void }
export class Button extends Rete.Control {
  render: string
  component: any
  props: ButtonProps & { emitter: NodeEditor }
  constructor(emitter: NodeEditor, key: string, label: string, events: { click?: () => void } = {}) {
    super(key);
    this.render = "react";
    this.component = (props: { click?: () => void, label: string }) => {
      // console.log('render', props.click)
      return <button onClick={props.click}>{label}</button>
    }
    this.props = {
      emitter,
      label,
      click: events.click
    };
  }
}

class ImportDeclaration extends Component {
  scope: 'root' = 'root'
  constructor() {
    super("Import");
  }

  async builder(node: Node) {
    node
      .addControl(new TextControl(this.editor as any, 'module', String(node.data.module || ''), false))
      .addControl(new TextControl(this.editor as any, 'source', String(node.data.source || ''), false))
      .addOutput(new Rete.Output('return', 'Return', anySocket))
  }

  worker() { 1 }
}

class VariableDeclaration extends Component {
  constructor() {
    super("Variable");
  }

  async builder(node: Node) {
    const inp = new Rete.Input('value', 'Value', valSocket)
    inp.addControl(new TextControl(this.editor as any, 'value', String(node.data.value), false))

    node
      .addInput(inp)
      .addOutput(new Rete.Output('return', "Variable", varSocket))

  }

  worker() { 1 }
}


class ParameterDeclaration extends Component {
  scope = FunctionDeclaration
  constructor() {
    super("Parameter");
  }

  async builder(node: Node) {
    node
      .addControl(new TextControl(this.editor as any, 'name', String(node.data.name), false))
      .addOutput(new Rete.Output('return', "Variable", varSocket))

  }

  worker() { 1 }
}

class BinaryOperator extends Component {
  data!: {
    op: string
    left: $<string>
    right: $<string>
  }
  constructor() {
    super("Binary operator");
  }

  async builder(node: Node) {
    const left = new Rete.Input('left', 'Left', anySocket)
    left.addControl(new TextControl(this.editor as any, 'left', node.data.left as any, false))
    const right = new Rete.Input('right', 'Right', anySocket)
    right.addControl(new TextControl(this.editor as any, 'right', node.data.right as any, false))

    node
      .addInput(left)
      .addInput(right)
      .addControl(new TextControl(this.editor as any, 'op', String(node.data.op), true))
      .addOutput(new Rete.Output('return', "Return", anySocket))
  }

  worker() { 1 }
}

class Conditional extends Component {
  data!: {
    consequent: $<string>
    alternate: $<string>
  }
  constructor() {
    super("Condition");
  }

  async builder(node: Node) {
    const consequent = new Rete.Input('consequent', 'Consequent', anySocket)
    consequent.addControl(new TextControl(this.editor as any, 'op', node.data.consequent as any, true))
    const alternate = new Rete.Input('alternate', 'Alternate', anySocket)
    alternate.addControl(new TextControl(this.editor as any, 'op', node.data.alternate as any, true))
    node
      .addInput(new Rete.Input('test', 'Test', anySocket))
      .addInput(consequent)
      .addInput(alternate)
      .addOutput(new Rete.Output('return', 'Return', anySocket))

  }

  worker() { 1 }
}

export type NestedNode = Node & { belongsTo?: Node | null }

export interface INestedNodeControl extends Control {
  adjustPlacement(): void
}

class NestedNodeControl extends Rete.Control implements INestedNodeControl {
  render: string
  component: any
  props: { editor: NodeEditor, width: number, height: number, extender: number, onRef: (el: HTMLElement | null) => void }
  box: HTMLElement | null = null
  margin = 20
  scopeComponents: string[]
  rootComponents: string[]

  constructor(private editor: NodeEditor, private scope: Scope, key: string, private node: Node) {
    super(key);
    this.render = "react";
    this.component = ({ onRef, height, width, extender }: typeof this.props) => {
      const inputEl = useRef(null);

      React.useEffect(() => onRef(inputEl.current), [inputEl])

      return <div ref={inputEl} style={{ background: 'white', height: `${height + extender}px`, width: `${width + extender}px` }}></div>
    }

    this.scopeComponents = Object.values(components).filter(c => c.scope === this.scope).map(c => c.name)
    this.rootComponents = Object.values(components).filter(c => c.scope === 'root').map(c => c.name)
    this.props = {
      editor,
      width: 140,
      height: 100,
      extender: 0,
      onRef: el => {
        this.box = el
      }
    };

    this.fixOrder()
    this.moveNestedNodes()
    this.updatingBelongTo()
    this.updateConnections()
    this.updateSizes()
  }

  fixOrder() {
    this.editor.on('rendernode', params => {
      if (params.node !== this.node) return
      params.el.style.zIndex = '-2'
    })
  }

  updateSizes() {
    const selectedNodes = new Set<Node>()
    let startPosition: [number, number] | null = null
    this.editor.on('nodeselect', (node: NestedNode) => {
      if (node === this.node) return
      selectedNodes.add(node)
      startPosition = [...this.node.position]
    })
    this.editor.on('nodetranslated', (args) => {
      if (args.node === this.node) return
      const view = this.editor.view.nodes.get(args.node)
      const el = view?.el
      if (!el || !this.box || !startPosition) return

      const k = 250
      const intersects = this.intersects(el, this.box)
      const inInner = this.scopeComponents.includes(args.node.name)
      const belongsToCurrentFunction = (args.node as NestedNode).belongsTo === this.node

      if (intersects && (!inInner || belongsToCurrentFunction)) {
        this.props.extender = k

        const view = this.editor.view.nodes.get(this.node)
        this.node.position = [startPosition[0] - k / 2, startPosition[1] - k / 2]
        view?.update()

          ; (this as any).update()

        this.editor.view.updateConnections({ node: this.node })
      }
    })
    this.editor.on('nodedragged', (node: NestedNode) => {
      if (node === this.node) return
      if (!startPosition) return

      // const view = this.editor.view.nodes.get(this.node)
      // this.node.position = startPosition
      // view?.update()
      this.adjustPlacement()

      this.props.extender = 0;
      startPosition = null
        ; (this as any).update()
      selectedNodes.delete(node)
      this.editor.view.updateConnections({ node: this.node })
    })
  }

  public adjustPlacement() {
    const nestedNodes = this.editor.nodes.filter(n => (n as NestedNode).belongsTo === this.node)

    const nestedNodesViews = nestedNodes
      .map(n => this.editor.view.nodes.get(n))
      .filter((n): n is NodeView => Boolean(n))
      .map(view => ({ rect: view.el.getBoundingClientRect(), view }))
    type Item = typeof nestedNodesViews[0]
    if (!nestedNodesViews.length) return

    const minLeft = _.minBy(nestedNodesViews, a => a.rect.left) as Item
    const minTop = _.minBy(nestedNodesViews, a => a.rect.top) as Item
    const maxRight = _.maxBy(nestedNodesViews, a => a.rect.right) as Item
    const maxBottom = _.maxBy(nestedNodesViews, a => a.rect.bottom) as Item

    this.props.width = (maxRight.rect.right - minLeft.rect.left) / this.editor.view.area.transform.k + this.margin * 2
    this.props.height = (maxBottom.rect.bottom - minTop.rect.top) / this.editor.view.area.transform.k + this.margin * 2

    const sideMargin = 20
    const topMargin = 80
    this.node.position = [minLeft.view.node.position[0] - sideMargin - this.margin, minTop.view.node.position[1] - topMargin - this.margin]
      ; (this as any).update()
    this.editor.view.nodes.get(this.node)?.update()
  }

  moveNestedNodes() {
    this.editor.on('nodetranslated', args => {
      if (args.node !== this.node) return
      const belongs = this.editor.nodes.filter(n => (n as NestedNode).belongsTo === args.node)

      belongs.forEach(n => {
        const dx = args.node.position[0] - args.prev[0]
        const dy = args.node.position[1] - args.prev[1]

        this.editor.view.nodes.get(n)?.translate(n.position[0] + dx, n.position[1] + dy)
      })
    })
  }

  updatingBelongTo() {
    const startPosition = new Map<Node, [number, number]>()
    this.editor.on('nodeselect', (node: NestedNode) => {
      startPosition.set(node, [...node.position])
    })
    this.editor.on('nodedragged', (node: NestedNode) => {
      const view = this.editor.view.nodes.get(node)
      const el = view?.el

      if (!el || !this.box) return
      const intersects = this.contains(el, this.box)
      const isFuncSpecific = this.scopeComponents.includes(node.name)
      const isRootSpecific = this.rootComponents.includes(node.name)

      if (intersects && !isRootSpecific && !(isFuncSpecific && node.belongsTo !== this.node)) {
        node.belongsTo = this.node
      } else if ((isFuncSpecific && node.belongsTo === this.node) || (isRootSpecific && intersects)) {

        const pos = startPosition.get(node)

        pos && view.translate(pos[0], pos[1])
      } else if (node.belongsTo === this.node) {
        node.belongsTo = null
      }

      startPosition.delete(node)
    })
  }

  getInputLoopNodes(current: Node, target: Node): Connection[] {
    const inputCons = getConnections(current, 'input')

    const directInputs = inputCons.filter(c => c['output'].node === target)
    if (directInputs.length) return directInputs

    return inputCons.map(c => {
      const n = c['output'].node

      return n && this.getInputLoopNodes(n, target).length ? c : null
    }).filter((c): c is Connection => Boolean(c))
  }

  updateConnections() {
    // listen after updatingBelongTo
    this.editor.on('nodedragged', (node: NestedNode) => {
      if (node.belongsTo === this.node) {
        this.getInputLoopNodes(node, node.belongsTo).forEach(c => {
          this.editor.removeConnection(c)
        })
        getConnections(node, 'output').forEach(c => {
          if ((c.input.node as NestedNode).belongsTo !== this.node) {
            this.editor.removeConnection(c)
          }
        })
      } else {
        getConnections(node, 'input').forEach(c => {
          if ((c.output.node as NestedNode).belongsTo === this.node) {
            this.editor.removeConnection(c)
          }
        })
      }
    })
    this.editor.on('connectioncreate', ({ input, output }) => {
      const outputBelongTo = (output.node as NestedNode).belongsTo
      const inputBelongTo = (input.node as NestedNode).belongsTo

      return !outputBelongTo || outputBelongTo === inputBelongTo
    })
  }

  contains(element: HTMLElement, box: HTMLElement) {
    const rect = element.getBoundingClientRect()
    const boxRect = box.getBoundingClientRect()

    return rect.top > boxRect.top
      && rect.left > boxRect.left
      && rect.bottom < boxRect.bottom
      && rect.right < boxRect.right
  }

  intersects(element: HTMLElement, box: HTMLElement) {
    const rect = element.getBoundingClientRect()
    const boxRect = box.getBoundingClientRect()

    return boxRect.left < rect.right &&
      boxRect.right > rect.left &&
      boxRect.top < rect.bottom &&
      boxRect.bottom > rect.top
  }

}

class FunctionDeclaration extends Component {
  scope: 'root' = 'root'
  constructor() {
    super("Function");
  }

  async builder(node: Node) {
    node
      .addControl(new NestedNodeControl(this.editor as any, FunctionDeclaration, 'area', node))
      .addOutput(new Rete.Output('return', 'Variable', anySocket))
  }

  worker() { 1 }
}

class Call extends Component {
  constructor() {
    super("Call");
  }

  async builder(node: Node) {
    const inputFunc = new Rete.Input('function', 'Function', funcSocket)

    node.addInput(inputFunc)

    node.addOutput(new Rete.Output('return', 'Return', anySocket))

    const args = node.data.arguments as (string | undefined)[]

    for (const i in args) {
      const value = args[i]
      const key = 'arg' + i
      const inp = new Rete.Input(key, 'Argument ' + i, anySocket)
      inp.addControl(new TextControl(this.editor as any, key, value || '', false))
      node.addInput(inp)
    }
  }

  worker() { 1 }
}

class Member extends Component {
  constructor() {
    super("Member");
  }

  async builder(node: Node) {
    node
      .addControl(new TextControl(this.editor as any, 'property', String(node.data.property), false))
      .addInput(new Rete.Input('object', 'Object', objSocket))
      .addOutput(new Rete.Output('return', 'Any', anySocket))

  }

  worker() { 1 }
}

class ObjectComp extends Component {
  constructor() {
    super("Object");
  }

  async builder(node: Node) {
    function update() {
      const properties = (node.data.properties as string).split(',').map(item => item.trim()).filter(item => item)

      Array.from(node.inputs.values()).forEach(inp => node.removeInput(inp))

      properties.forEach(item => {
        node.addInput(new Rete.Input(item, item, anySocket))
      })
      node.update()
    }

    node.addControl(new TextControl(this.editor as any, 'properties', String(node.data.properties || ''), false, { change: update }))

    node.addOutput(new Rete.Output('return', 'Return', anySocket))


  }

  worker() { 1 }
}

class Return extends Component {
  scope = FunctionDeclaration
  constructor() {
    super("Return");
  }

  async builder(node: Node) {
    node
      .addInput(new Rete.Input('argument', 'Argument', anySocket))

  }

  worker() { 1 }
}

const components = {
  VariableDeclaration: new VariableDeclaration(),
  ParameterDeclaration: new ParameterDeclaration(),
  Call: new Call(),
  Member: new Member(),
  Return: new Return(),
  Object: new ObjectComp(),
  ImportDeclaration: new ImportDeclaration(),
  FunctionDeclaration: new FunctionDeclaration(),
  BinaryOperator: new BinaryOperator(),
  Conditional: new Conditional()
}

export async function createEditor(container: HTMLElement) {

  const editor = new Rete.NodeEditor('demo@0.1.0', container);
  editor.use(ConnectionPlugin);
  // editor.use(VueRenderPlugin);
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


  const engine = new Rete.Engine('demo@0.1.0');

  Object.values(components).map(c => {
    editor.register(c);
    engine.register(c);
  });

  // editor.on('process nodecreated noderemoved connectioncreated connectionremoved' as any, async () => {
  //   console.log('process');
  //     await engine.abort();
  //     await engine.process(editor.toJSON());
  // });

  editor.view.resize();
  // AreaPlugin.zoomAt(editor)

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
