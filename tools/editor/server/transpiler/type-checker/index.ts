import ts, { TypeFlags } from '@tsd/typescript'
import { TypingKindHelper } from './typing-kind'

type Pattern = string

export class TypeChecker {
  checker: ts.TypeChecker
  patterns: {
    [key in string]: ts.TypeAliasDeclaration
  }

  constructor(program: ts.Program, typingKindHelpers?: TypingKindHelper[]) {
    this.checker = program.getTypeChecker()

    this.patterns = typingKindHelpers?.reduce((acc, { name, file, types }) => {
      const patternsSource = program.getSourceFile(file)

      if (!patternsSource) throw new Error('cannot find parrents file')

      return {
        ...acc,
        ...Object.fromEntries(types.map(type => [`${name}:${type}`, this.getTypeDeclarationNode(type, patternsSource)]))
      }
    }, {}) || {}
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

    return !isAny && this.isTypeAssignableTo(sourceType, targetType)
  }

  private getParameters(a: ts.Type) {
    const declarations = a.getSymbol()?.getDeclarations()
    if (!declarations || !declarations[0]) {
      return null
    }

    const methodDeclaration = declarations[0]

    try {
      const signature = this.checker.getSignatureFromDeclaration(methodDeclaration as any);
      if (!signature) {
        return null
      }

      return signature.getParameters()
    } catch (e) {
        return null
    }
  }

  private getReturnType(a: ts.Type) {
    const declarations = a.getSymbol()?.getDeclarations()
    if (!declarations || !declarations[0]) {
      return null
    }

    const methodDeclaration = declarations[0]

    try {
      const signature = this.checker.getResolvedSignature(methodDeclaration as any);
      if (!signature) {
        return null
      }

      return signature.getReturnType()
    } catch (e) {
      console.error(e)
        return null
    }
  }

  private isTypeAssignableTo(sourceType: ts.Type, targetType: ts.Type) {
    const n = this.checker.isTypeAssignableTo(sourceType, targetType)

    if (n) {
      const sourceReturnType = this.getReturnType(sourceType)
      const targetReturnType = this.getReturnType(targetType)
      const sourceParameters = this.getParameters(sourceType)
      const targetParameters = this.getParameters(targetType)

      if ((sourceReturnType === null) !== (targetReturnType === null)) return false
      if (sourceReturnType && targetReturnType) return this.checker.isTypeAssignableTo(sourceReturnType, targetReturnType)
      return true
    }
    return n
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

  public getTyping(node: ts.Node) {
    return {
      typingKind: this.findPattern(node),
      typingText: this.checker.typeToString(this.checker.getTypeAtLocation(node))
    }
  }
}
