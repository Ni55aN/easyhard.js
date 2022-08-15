import { Node, Output } from 'rete'
import { NestedNodeControl } from '../controls';
import { Component } from './base'
import * as sockets from '../sockets'

export class FunctionDeclaration extends Component {
  scope = 'root' as const
  constructor(private componentsGetter: () => {[key: string]: Component }) {
    super("Function");
  }

  async builder(node: Node) {
    node
      .addControl(new NestedNodeControl(this.editor as any, FunctionDeclaration, 'area', node, this.componentsGetter()))
      .addOutput(new Output('return', 'Variable', sockets.any))
  }

  worker() { 1 }
}
