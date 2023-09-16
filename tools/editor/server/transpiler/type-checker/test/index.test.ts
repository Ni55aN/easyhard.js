import { describe, expect, test } from '@jest/globals'
import { resolve, join } from 'path'
import fs from 'fs'
import ts, { CompilerOptions, ModuleKind } from '@tsd/typescript'
import { TypeChecker } from '..'
import { TypingKindHelper } from '../typing-kind'


function createProgramWithSourceFile(sourceText: string, helper: TypingKindHelper) {
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
    rootNames: [filePath, helper.file],
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
  // test('basic', async () => {
  //   const typingKindHelper: TypingKindHelper = {
  //     name: 'Test',
  //     file: resolve(__dirname, 'typing-kinds-1.ts'),
  //     types: ['Num', 'Str', 'FuncNum', 'FuncStr']
  //   }
  //   const { program, sourceFile } = createProgramWithSourceFile(`
  //     const num1 = 1
  //     const num2 = Number('2')
  //     const str1 = '1'
  //     const bool1 = true
  //     const func1 = () => 1
  //     const func2 = () => '1'
  //   `, typingKindHelper)
  //   const checker = new TypeChecker(program, [typingKindHelper])

  //   const num1 = findVariable(sourceFile, 'num1')
  //   const num2 = findVariable(sourceFile, 'num2')
  //   const str1 = findVariable(sourceFile, 'str1')
  //   const bool1 = findVariable(sourceFile, 'bool1')
  //   const func1 = findVariable(sourceFile, 'func1')
  //   const func2 = findVariable(sourceFile, 'func2')

  //   expect(checker.findPattern(num1)).toBe('Test:Num')
  //   expect(checker.findPattern(num2)).toBe('Test:Num')
  //   expect(checker.findPattern(str1)).toBe('Test:Str')
  //   expect(checker.findPattern(bool1)).toBe(null)
  //   expect(checker.findPattern(func1)).toBe('Test:FuncNum')
  //   expect(checker.findPattern(func2)).toBe('Test:FuncStr')
  // })

  describe('generic function and ...args: any[]', () => {
    function prepare(types: string[]) {
      const typingKindHelper: TypingKindHelper = {
        name: 'Test',
        file: resolve(__dirname, 'typing-kinds-2.ts'),
        types
      }
      const { program, sourceFile } = createProgramWithSourceFile(`
        type List = {
          "a": string
          "b": boolean
        }
        type Keys = 'a' | 'b'

        type FuncGeneric = <K extends Keys = Keys>(a: K, b: K) => List[K]

        const funcGeneric = 1 as any as FuncGeneric
      `, typingKindHelper)

      return {
        program,
        sourceFile,
        typingKindHelper
      }
    }

    // https://github.com/microsoft/TypeScript/issues/50526#issuecomment-1234683357
    // test('check return type if ...args: any[] present - doesnt match', async () => {
    //   const { program, typingKindHelper, sourceFile } = prepare(['Func1'])
    //   const checker = new TypeChecker(program, [typingKindHelper])

    //   const funcGeneric = findVariable(sourceFile, 'funcGeneric')

    //   expect(checker.findPattern(funcGeneric)).toBe(null)
    // })

    // test('check return type - match', async () => {
    //   const { program, typingKindHelper, sourceFile } = prepare(['Func1', 'Func2'])
    //   const checker = new TypeChecker(program, [typingKindHelper])

    //   const funcGeneric = findVariable(sourceFile, 'funcGeneric')

    //   expect(checker.findPattern(funcGeneric)).toBe('Test:Func2')
    // })

    test('check return type with generic - TS cannot typecheck', async () => {
      const { program, typingKindHelper, sourceFile } = prepare(['Func3'])
      const checker = new TypeChecker(program, [typingKindHelper])

      const funcGeneric = findVariable(sourceFile, 'funcGeneric')

      expect(checker.findPattern(funcGeneric)).toBe(null) // TS cannot typecheck with generic parameter
    })

    // test('check return type with generic - no generic parameters used in return type', async () => {
    //   const { program, typingKindHelper, sourceFile } = prepare(['Func4'])
    //   const checker = new TypeChecker(program, [typingKindHelper])

    //   const funcGeneric = findVariable(sourceFile, 'funcGeneric')

    //   expect(checker.findPattern(funcGeneric)).toBe('Test:Func4')
    // })
  })
})
