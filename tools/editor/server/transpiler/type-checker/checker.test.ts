import { describe, expect, test } from '@jest/globals'
import { join } from 'path'
import fs from 'fs'
import ts, { CompilerOptions, ModuleKind } from '@tsd/typescript'
import { TypeChecker } from '.'
import { EasyhardTransformer, RxTransformer } from '../../simplifier/transformers'

const rxSimplifier = new RxTransformer
const ehSimplifier = new EasyhardTransformer

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
    rootNames: [filePath, rxSimplifier.typingKindHelper.file, ehSimplifier.typingKindHelper.file],
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
  const variable = declarations.find(declaration => ts.isIdentifier(declaration.name) && declaration.name.text === name)

  if (!variable) throw new Error('cannot find variable ' + name)

  return variable
}

describe('type checker', () => {
  test('basic', async () => {
    const { program, sourceFile } = createProgramWithSourceFile(`
      import { of } from 'rxjs'
      import { map } from 'rxjs/operators'
      import { h } from 'easyhard'

      const ob = of()
      const op = map()
      const createEl = h
      const el = h('div', {})
    `)
    const checker = new TypeChecker(program, [rxSimplifier.typingKindHelper, ehSimplifier.typingKindHelper])

    const ob = findVariable(sourceFile, 'ob')
    const op = findVariable(sourceFile, 'op')
    const createEl = findVariable(sourceFile, 'createEl')
    const el = findVariable(sourceFile, 'el')

    expect(checker.findPattern(ob)).toBe('RxJS:Observable')
    expect(checker.findPattern(op)).toBe('RxJS:Operator')
    expect(checker.findPattern(createEl)).toBe('Easyhard:EasyhardH')
    expect(checker.findPattern(el)).toBe('Easyhard:HtmlElement')
  })
})
