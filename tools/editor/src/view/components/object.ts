import { Input, Node, Output } from 'rete'
import { Component } from './base'
import * as sockets from '../sockets'
import { TextControl } from '../controls';

export class ObjectComp extends Component {
  constructor() {
    super("Object");
  }

  async builder(node: Node) {
    function update() {
      const properties = (node.data.properties as string).split(',').map(item => item.trim()).filter(item => item)

      Array.from(node.inputs.values()).forEach(inp => node.removeInput(inp))

      properties.forEach(item => {
        node.addInput(new Input(item, item, sockets.any))
      })
      node.update()
    }

    node.addControl(new TextControl(this.editor as any, 'properties', String(node.data.properties || ''), false, { change: update }))

    node.addOutput(new Output('return', 'Return', sockets.any))
  }

  worker() { 1 }
}
