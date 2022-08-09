import { Input, Node, Output } from 'rete'
import { TextControl } from '../controls'
import { Component } from './base'
import * as sockets from '../sockets'

export class VariableDeclaration extends Component {
  constructor() {
    super("Variable");
  }

  async builder(node: Node) {
    const inp = new Input('value', 'Value', sockets.value)
    inp.addControl(new TextControl(this.editor as any, 'value', String(node.data.value), false))

    node
      .addInput(inp)
      .addOutput(new Output('return', "Variable", sockets.variable))

  }

  worker() { 1 }
}
