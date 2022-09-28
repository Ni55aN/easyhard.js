import ts, { ModuleKind } from '@tsd/typescript'
import { Graph } from './types'
import { astToGraph } from './ast-to-graph'
import { TypeChecker } from './type-checker'
import { Core } from 'cytoscape'
import { graphToAst } from './graph-to-ast'
import { TypingKindHelper } from './type-checker/typing-kind'

export class CodeTranspiler {
  private program: ts.Program
  private checker: TypeChecker

  constructor(private filepath: string, typingKindHelpers?: TypingKindHelper[]) {
    this.program = ts.createProgram({
      rootNames: [filepath, ...(typingKindHelpers?.map(n => n.file) || [])],
      options: {
        module: ModuleKind.CommonJS,
        esModuleInterop: true,
        strict: true
      }
    })
    this.checker = new TypeChecker(this.program, typingKindHelpers)
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
