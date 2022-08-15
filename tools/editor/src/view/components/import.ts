import { Node, Output } from 'rete'
import { TextControl } from '../controls'
import { Component } from './base'
import * as sockets from '../sockets'

export class ImportDeclaration extends Component {
  scope = 'root' as const
  constructor() {
    super("Import");
  }

  async builder(node: Node) {
    node
      .addControl(new TextControl(this.editor as any, 'module', String(node.data.module || ''), false))
      .addControl(new TextControl(this.editor as any, 'source', String(node.data.source || ''), false))
      .addOutput(new Output('return', 'Return', sockets.any))
  }

  worker() { 1 }
}
