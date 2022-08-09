import { Input, Node, Output } from 'rete'
import { Component } from './base'
import * as sockets from '../sockets'
import { TextControl } from '../controls';

export class Member extends Component {
  constructor() {
    super("Member");
  }

  async builder(node: Node) {
    node
      .addControl(new TextControl(this.editor as any, 'property', String(node.data.property), false))
      .addInput(new Input('object', 'Object', sockets.obj))
      .addOutput(new Output('return', 'Any', sockets.any))
  }

  worker() { 1 }
}
