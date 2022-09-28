import { describe, expect, test } from '@jest/globals'
import { join } from 'path'
import fs from 'fs'
import ts, { CompilerOptions, ModuleKind } from '@tsd/typescript'
import { TypeChecker } from '.'

function createProgramWithSourceFile(sourceText: string) {
  const options: CompilerOptions = {
    module: ModuleKind.CommonJS,
    esModuleInterop: true,
    strict: true
  }
  const filePath = join(__dirname, 'file.ts')
  const host = ts.createCompilerHost(options)

  host.readFile = (filename) => {
    if (filePath === filename) return sourceText
    return fs.readFileSync(filename, 'utf-8')
  }

  const program = ts.createProgram({
    rootNames: [filePath, TypeChecker.patternsPath],
    host,
    options
  })
  const sourceFile = program.getSourceFile(filePath)
  if (!sourceFile) throw new Error('sourceFile')

  return {
    program,
    sourceFile
  }
}

function findVariable(sourceFile: ts.SourceFile, name: string) {
  const statements = sourceFile
    .getChildren()[0].getChildren()
    .filter(n => ts.isVariableStatement(n)) as ts.VariableStatement[]
  const declarations = statements.map(n => n.declarationList.declarations).flat()
  const variable = declarations .find(declaration => ts.isIdentifier(declaration.name) && declaration.name.text === name)

  if (!variable) throw new Error('cannot find variable ' + name)

  return variable
}

describe('type checker', () => {
  test('basic', async () => {
    const { program, sourceFile } = createProgramWithSourceFile(`
      import { Observable as Ob, OperatorFunction } from 'rxjs'

      const op: OperatorFunction<any, any>
    `)
    const checker = new TypeChecker(program)

    const node = findVariable(sourceFile, 'op')

    expect(checker.findPattern(node)).toBe('Operator')
  })
})
