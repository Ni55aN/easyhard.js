import { $ } from 'easyhard'
import { Input, Node, Output } from 'rete'
import { TextControl } from '../controls'
import { Component } from './base'
import * as sockets from '../sockets'

export class BinaryOperator extends Component {
  data!: {
    op: string
    left: $<string>
    right: $<string>
  }
  constructor() {
    super("Binary operator");
  }

  async builder(node: Node) {
    const left = new Input('left', 'Left', sockets.any)
    left.addControl(new TextControl(this.editor as any, 'left', node.data.left as any, false))
    const right = new Input('right', 'Right', sockets.any)
    right.addControl(new TextControl(this.editor as any, 'right', node.data.right as any, false))

    node
      .addInput(left)
      .addInput(right)
      .addControl(new TextControl(this.editor as any, 'op', String(node.data.op), true))
      .addOutput(new Output('return', "Return", sockets.any))
  }

  worker() { 1 }
}
