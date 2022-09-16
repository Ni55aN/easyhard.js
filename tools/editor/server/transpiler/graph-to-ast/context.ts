import { NodeSingular } from 'cytoscape'
import ts from 'typescript'

export class Context {
  variables = new Map<string, string>()
  types = new Map<string, string>()

  constructor(public parent: Context | undefined, private scope: string | undefined, public prepend: (n: ts.Statement) => void) {}

  private _getTop(current: Context): Context {
    return current.parent ? this._getTop(current.parent) : current
  }

  _findVariable(context: Context, nodeId: string): null | string {
    const found = context.variables.get(nodeId)

    if (found) return found
    return context.parent ? this._findVariable(context.parent, nodeId) : null
  }

  findVariable(nodeId: string) {
    const v = this._findVariable(this, nodeId)

    return v
  }

  _findType(context: Context, nodeId: string): null | string {
    const found = context.types.get(nodeId)

    if (found) return found
    return context.parent ? this._findVariable(context.parent, nodeId) : null
  }

  findType(nodeId: string) {
    const v = this._findType(this, nodeId)

    return v
  }

  addVariable(nodeId: string, name: string) {
    this.variables.set(nodeId, name)
  }

  addType(nodeId: string, name: string) {
    this.types.set(nodeId, name)
  }

  getTop() {
    return this._getTop(this)
  }

  isBelong(node: NodeSingular) {
    return node.data('parent') === this.scope
  }

  static findBelongingContext(node: NodeSingular, context: Context): Context | null {
    const parent = context.getParent()

    if (context.isBelong(node)) return context
    if (parent) return Context.findBelongingContext(node, parent)
    return null
  }


  getParent() {
    return this.parent
  }
}
