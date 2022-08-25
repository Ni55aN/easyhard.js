import ts from '@tsd/typescript'
import { Graph } from './types'
import { process } from './processor'

export * from './processor'

export class Transpiler {
  private program: ts.Program

  constructor(private filepath: string) {
    this.program = ts.createProgram({
      rootNames: [filepath],
      options: {}
    })
  }

  getAST() {
    const source = this.program.getSourceFile(this.filepath)

    if (!source) throw new Error('source not found')
    return source
  }

  process(graph: Graph) {
    return process(this.getAST(), { graph })
  }
}
