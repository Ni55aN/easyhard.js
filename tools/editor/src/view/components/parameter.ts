import { Node, Output } from 'rete'
import { TextControl } from '../controls'
import { Component } from './base'
import * as sockets from '../sockets'
import { FunctionDeclaration } from './function'

export class ParameterDeclaration extends Component {
  scope = FunctionDeclaration
  constructor() {
    super("Parameter");
  }

  async builder(node: Node) {
    node
      .addControl(new TextControl(this.editor as any, 'name', String(node.data.name), false))
      .addOutput(new Output('return', "Variable", sockets.variable))

  }

  worker() { 1 }
}
