import { TypeChecker } from '../type-checker';
import { Graph, Scope } from '../types';

export class Context {
  deffered: Array<() => Promise<void>> = []

  constructor(public checker: TypeChecker, public graph: Graph, public parent?: Scope) {}

  getSubcontext(parent: string) {
    return new Context(this.checker, this.graph, parent)
  }

  addDeffered(handler: () => Promise<void>) {
    this.deffered.push(handler)
  }

  async flushDeffered() {
    do {
      const handler = this.deffered.shift()

      if (handler) await handler()
    } while (this.deffered.length)
  }
}
