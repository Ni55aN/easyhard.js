import ts, { ModuleKind } from '@tsd/typescript'
import { join } from 'path'
import { Graph } from './types'
import { process } from './processor'
import { TypeChecker } from './type-checker'

export * from './processor'

export class Transpiler {
  private program: ts.Program
  private checker: TypeChecker

  constructor(private filepath: string) {
    this.program = ts.createProgram({
      rootNames: [filepath, TypeChecker.patternsPath, join(__dirname, '../foo.d.ts')],
      options: {
        module: ModuleKind.CommonJS,
        esModuleInterop: true,
        strict: true
      }
    })
    this.checker = new TypeChecker(this.program)
  }

  getAST() {
    const source = this.program.getSourceFile(this.filepath)

    if (!source) throw new Error('source not found')
    return source
  }

  process(graph: Graph) {
    return process(this.getAST(), { checker: this.checker, graph })
  }
}
