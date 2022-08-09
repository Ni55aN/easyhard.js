import { Input, Node, Output } from 'rete'
import { Component } from './base'
import * as sockets from '../sockets'
import { TextControl } from '../controls';

export class Call extends Component {
  constructor() {
    super("Call");
  }

  async builder(node: Node) {
    const inputFunc = new Input('function', 'Function', sockets.func)

    node.addInput(inputFunc)

    node.addOutput(new Output('return', 'Return', sockets.any))

    const args = node.data.arguments as (string | undefined)[]

    for (const i in args) {
      const value = args[i]
      const key = 'arg' + i
      const inp = new Input(key, 'Argument ' + i, sockets.any)
      inp.addControl(new TextControl(this.editor as any, key, value || '', false))
      node.addInput(inp)
    }
  }

  worker() { 1 }
}
