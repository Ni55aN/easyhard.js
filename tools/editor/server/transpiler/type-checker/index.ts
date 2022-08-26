import { join } from 'path'
import ts, { TypeFlags } from '@tsd/typescript'

type Pattern = 'Operator' | 'Observable' | 'OperatorFactory' | 'Builtin'
type PatternsSet = {
  [key in Pattern]: ts.TypeAliasDeclaration
}

export class TypeChecker {
  static patternsPath =  join(__dirname, 'patterns.ts')
  checker: ts.TypeChecker
  patterns: PatternsSet

  constructor(program: ts.Program) {
    this.checker = program.getTypeChecker()

    const patternsSource = program.getSourceFile(TypeChecker.patternsPath)
    if (!patternsSource) throw new Error('cannot find parrents file')

    this.patterns = {
      Operator: this.getTypeDeclarationNode('Operator', patternsSource),
      Observable: this.getTypeDeclarationNode('Observable', patternsSource),
      OperatorFactory: this.getTypeDeclarationNode('OperatorFactory', patternsSource),
      Builtin: this.getTypeDeclarationNode('Builtin', patternsSource),
    }
  }

  private getTypeDeclarationNode(name: Pattern, source: ts.SourceFile) {
    const type = source.getChildAt(0).getChildren()
      .filter(ts.isTypeAliasDeclaration)
      .find(node => {
        return node.name.escapedText === name
      })

     if (!type) throw new Error('cannot find TypeAliasDeclaration in patterns')

    return type
  }

  private hasFlag(type: ts.Type, flag: ts.TypeFlags) {
    return (type.flags & flag) === flag;
  }

  private matchPattern(node: ts.Node, pattern: Pattern) {
    const sourceType = this.checker.getTypeAtLocation(node)
    const targetType = this.checker.getTypeAtLocation(this.patterns[pattern])

    const isAny = this.hasFlag(sourceType, TypeFlags.Any)

    return !isAny && this.checker.isTypeAssignableTo(sourceType, targetType)
  }

  public findPattern(node: ts.Node): Pattern | null {
    let pattern: Pattern
    for (pattern in this.patterns) {
      if (this.matchPattern(node, pattern)) {
        return pattern
      }
    }
    return null
  }

  getTyping(node: ts.Node) {
    return {
      typingKind: this.findPattern(node),
      typingText: this.checker.typeToString(this.checker.getTypeAtLocation(node))
    }
  }
}
