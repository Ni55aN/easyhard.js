import { Input, Node } from 'rete'
import { Component } from './base'
import * as sockets from '../sockets'
import { FunctionDeclaration } from './function';

export class Return extends Component {
  scope = FunctionDeclaration
  constructor() {
    super("Return");
  }

  async builder(node: Node) {
    node
      .addInput(new Input('argument', 'Argument', sockets.any))
  }

  worker() { 1 }
}
