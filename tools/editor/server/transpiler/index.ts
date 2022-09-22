import ts, { ModuleKind } from '@tsd/typescript'
import { join } from 'path'
import { Graph } from './types'
import { astToGraph } from './ast-to-graph'
import { TypeChecker } from './type-checker'
import { Core } from 'cytoscape'
import { graphToAst } from './graph-to-ast'

export class CodeTranspiler {
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

  async toGraph(graph: Graph) {
    return astToGraph(this.getAST(), this.checker, graph)
  }
}

export class GraphTranpiler {
  async toSourceFile(graph: Core) {
    return graphToAst(graph)
  }

  print(sourceFile: ts.SourceFile) {
    const printer = ts.createPrinter({
      newLine: ts.NewLineKind.LineFeed
    })

    return printer.printFile(sourceFile)
  }
}
