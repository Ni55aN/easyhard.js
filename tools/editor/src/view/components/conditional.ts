import { $ } from 'easyhard'
import { Input, Node, Output } from 'rete'
import { TextControl } from '../controls'
import { Component } from './base'
import * as sockets from '../sockets'


export class Conditional extends Component {
  data!: {
    consequent: $<string>
    alternate: $<string>
  }
  constructor() {
    super("Condition");
  }

  async builder(node: Node) {
    const consequent = new Input('consequent', 'Consequent', sockets.any)
    consequent.addControl(new TextControl(this.editor as any, 'op', node.data.consequent as any, true))
    const alternate = new Input('alternate', 'Alternate', sockets.any)
    alternate.addControl(new TextControl(this.editor as any, 'op', node.data.alternate as any, true))
    node
      .addInput(new Input('test', 'Test', sockets.any))
      .addInput(consequent)
      .addInput(alternate)
      .addOutput(new Output('return', 'Return', sockets.any))

  }

  worker() { 1 }
}
