import { Core, EdgeCollection, EdgeSingular, NodeSingular } from 'cytoscape'
import {
  BinaryOperatorType, CallType, FunctionDeclarationType, ImportDeclarationType,
  LiteralType, MemberType, NodeType, ParameterDeclarationType,
  VariableDeclarationType, ReturnType, ObjectType, ConditionalType
} from './types'
import ts from 'typescript'
import { stringToToken } from './tokens'

const f = ts.factory

type Value = string | number | boolean | null
type NodeData = {
  id: string
  type: VariableDeclarationType
  identifiers: string[]
  value: Value
} | {
  id: string
  type: CallType
} | {
  id: string
  type: MemberType
  property: string
} | {
  id: string
  type: ObjectType
} | {
  id: string
  type: LiteralType
  value: string | number
} | {
  id: string
  type: BinaryOperatorType
  op: string
} | {
  id: string
  type: ConditionalType
} | {
  id: string
  type: FunctionDeclarationType
  identifiers: string[]
} | {
  id: string
  type: ReturnType
} | {
  id: string
  type: ParameterDeclarationType
  name: string
  identifiers: string[]
} | {
  id: string
  type: ImportDeclarationType
  module: string
  source?: string
  identifiers: string[]
}

type NodeTypeData = {
  id: string
  type: 'NumberType' | 'StringType' | 'UnionType' | 'IntersectionType' | 'ObjectType' | 'GenericCall'
} | {
  id: string
  type: 'ImportDeclaration'
  identifiers: string[]
} | {
  id: string
  type: 'Type'
  typeIdentifiers: string[]
}

function getLiteral(value: Value) {
  switch (typeof value) {
    case 'string': return f.createStringLiteral(value, true)
    case 'number': return f.createNumericLiteral(+value)
  }
  throw new Error('cannot process the value')
}

const refTypes = <NodeType[]>['ImportDeclaration', 'VariableDeclaration', 'FunctionDeclaration', 'ParameterDeclaration']
const topOnlyTypes =  <NodeType[]>['ImportDeclaration']

function getVariableName(node: NodeSingular) {
  const withId = `var_${node.id()}`
  const identifiers = node.data('identifiers')

  return (identifiers && identifiers[0]) || withId
}

function useExpression(node: NodeSingular, context: Context) {
  const name  = getVariableName(node)
  const data = node.data() as NodeData
  const ctx = topOnlyTypes.includes(data.type) ? context.getTop() : Context.findBelongingContext(node, context)

  if (!ctx) throw new Error('cannot find context')

  if (ctx.findVariable(node.id())) {
    return f.createIdentifier(name)
  }

  const isRefNode = refTypes.includes(data.type)

  if (isRefNode) {
    ctx.addVariable(node.id(), name)
    ctx.prepend(processNode(node, ctx))
    return f.createIdentifier(name)
  }

  const expression = processExpression(node, ctx)

  if (node.outgoers('edge').size() > 1) { // create variable if expression used in multiple places
    ctx.addVariable(node.id(), name)
    ctx.prepend(createVariable(name, expression))
    return f.createIdentifier(name)
  }

  if ('identifiers' in data && data.identifiers[0]) { // create variable if it originally has identifier (to keep code in sync with original source code)
    ctx.addVariable(node.id(), data.identifiers[0])
    ctx.prepend(createVariable(data.identifiers[0], expression))
    return f.createIdentifier(data.identifiers[0])
  }
  return expression
}

function processExpression(node: NodeSingular, context: Context): ts.Expression {
  const data = node.data() as NodeData

  if (data.type === 'Literal') {
    return getLiteral(data.value)
  } else if (data.type === 'BinaryOperator') {
    if (!data.op) throw new Error('op')
    const token = stringToToken(data.op)
    if (!token) throw new Error('token')
    const left = node.incomers('edge[label="left"]').source()
    const right = node.incomers('edge[label="right"]').source()

    return f.createBinaryExpression(
      useExpression(left, context),
      token,
      useExpression(right, context)
    )
  } else if (data.type === 'Call') {
    const func = node.incomers('edge[label="function"]').source()
    const typeArguments = node.incomers('edge[type="GenericType"]').sort((a, b) => a.data('index') - b.data('index'))
    const args = node.incomers('edge[type="Argument"]').sort((a, b) => a.data('index') - b.data('index'))

    return f.createCallExpression(
      useExpression(func, context),
      typeArguments.map((edge: EdgeSingular) => {
        return useType(edge.source(), context)
      }),
      args.map((edge: EdgeSingular) => {
        return useExpression(edge.source(), context)
      })
    )
  } else if (data.type === 'Member') {
    const obj = node.incomers('edge').source()

    return f.createPropertyAccessExpression(
      useExpression(obj, context),
      data.property
    )
  } else if (data.type === 'Object') {
    const inputs: EdgeCollection = node.incomers('edge')

    return f.createObjectLiteralExpression(
      inputs.map(inp => {
        return f.createPropertyAssignment(
          f.createIdentifier(inp.data('label')),
          useExpression(inp.source(), context)
        )
      }),
      false
    )
  } else if (data.type === 'Conditional') {
    const exp = node.incomers('edge').filter(n => !n.data('label')).source()
    const thn = node.incomers('edge[label="then"]').source()
    const els = node.incomers('edge[label="else"]').source()


    return f.createConditionalExpression(
      useExpression(exp, context),
      undefined,
      useExpression(thn, context),
      undefined,
      useExpression(els, context)
    )
  } else {
    throw 'processExpression'
  }
}

function processType(node: NodeSingular, context: Context): ts.TypeNode {
  const data = node.data() as NodeTypeData

  if (data.type === 'NumberType') {
    return f.createKeywordTypeNode(ts.SyntaxKind.NumberKeyword)
  } else if (data.type === 'StringType') {
    return f.createKeywordTypeNode(ts.SyntaxKind.StringKeyword)
  } else if (['UnionType', 'IntersectionType'].includes(data.type)) {
    const isUnion = data.type === 'UnionType'
    const incomers = node.incomers('edge')

    const types = incomers
      .map((edge: EdgeSingular) => edge.source())
      .map(n => {
        return processType(n, context)
      })

    return isUnion ? f.createUnionTypeNode(types) : f.createIntersectionTypeNode(types)
  } else if (data.type === 'ObjectType') {
    const properies = node.incomers('edge').map((edge: EdgeSingular) => {
      return {
        name: edge.data('label'),
        source: edge.source()
      }
    })
    const propSignatures = properies.map(({ name, source }) => {
      return f.createPropertySignature(
        undefined,
        f.createIdentifier(name),
        undefined,
        useType(source, context)
      )
    })

    return f.createTypeLiteralNode(propSignatures)
  } else if (data.type === 'ImportDeclaration') {
    useExpression(node, context) // force create import
    return f.createTypeReferenceNode(data.identifiers[0])
  } else if (data.type === 'GenericCall') {
    const args = node.incomers('edge')

    const typeArgs = args
      .filter(arg => arg.data('type') === 'TypeArgument')
      .map((arg: EdgeSingular) => useType(arg.source(), context))

    const source = (args
      .filter(arg => arg.data('type') === 'GenericType')
      .first() as EdgeSingular).source()
    const ref = useType(source, context) as ts.TypeReferenceNode

    return f.createTypeReferenceNode(ref.typeName, typeArgs)
  } else if (data.type === 'Type') {
    const type = node.incomers('edge').source()

    const statement = f.createTypeAliasDeclaration(
      undefined,
      undefined,
      f.createIdentifier(data.typeIdentifiers[0]),
      undefined,
      useType(type, context)
    )
    context.prepend(statement)
    return f.createTypeReferenceNode(statement.name)
  } else {
    throw new Error('processType')
  }
}

function getTypeName(node: NodeSingular) {
  const withId = `type_${node.id()}`
  const identifiers = node.data('typeIdentifiers') || node.data('identifiers')

  return (identifiers && identifiers[0]) || withId
}

function useType(node: NodeSingular, context: Context): ts.TypeNode {
  const name  = getTypeName(node)
  const ctx = Context.findBelongingContext(node, context)

  if (!ctx) throw new Error('cannot find context')

  if (ctx.findType(node.id())) {
    return f.createTypeReferenceNode(name)
  }

  ctx.addType(node.id(), name)
  return processType(node, context)
}

function createVariable(name: string, initializer: ts.Expression) {
  const ident = f.createIdentifier(name)
  const dec = f.createVariableDeclaration(ident, undefined, undefined, initializer)

  return f.createVariableDeclarationList([dec], ts.NodeFlags.Const)
}

function processNode(node: NodeSingular, context: Context): ts.Node {
  const data = node.data() as NodeData

  if (data.type === 'VariableDeclaration') {
    const name = getVariableName(node)
    if (data.value === undefined) throw new Error('value should not be undefined')
    const init = getLiteral(data.value)

    return createVariable(name, init)
  } else if (data.type === 'ImportDeclaration') {
    const { module } = data
    const name = getVariableName(node)

    return f.createImportDeclaration(
      undefined,
      undefined,
      f.createImportClause(
        false,
        undefined,
        f.createNamedImports([
          f.createImportSpecifier(false, undefined, f.createIdentifier(name))
        ])
      ),
      f.createStringLiteral(module)
    )

  } else if (data.type === 'FunctionDeclaration') {
    const name = getVariableName(node)
    const parameterNodes = node.children().filter(n => (n.data('type') as NodeType) === 'ParameterDeclaration')
    const funcLeaves = node.children().leaves()

    const statements: ts.Node[] = []
    const funcContext = new Context(context, node.id(), st => {
      statements.push(st)
    })
    const parameters = parameterNodes.map((n: NodeSingular) => {
      const type = n.incomers('edge[label="type"]').source()
      if (!type) throw new Error('type edge missing')

      return f.createParameterDeclaration(
        undefined,
        undefined,
        undefined,
        f.createIdentifier(n.data('name')),
        undefined,
        useType(type, funcContext),
        undefined
      )
    })

    funcLeaves.forEach((n: NodeSingular) => {
      parameterNodes.forEach(p => {
        funcContext.addVariable(p.id(), p.data('name'))
      })
      statements.push(processNode(n, funcContext))
    })

    return f.createFunctionDeclaration(
      undefined,
      undefined,
      undefined,
      f.createIdentifier(name),
      undefined,
      parameters,
      undefined,
      f.createBlock(statements as ts.Statement[], true) // TODO
    )

  } else if (data.type === 'Return') {
    const expNode = node.incomers('edge').source()

    return f.createReturnStatement(useExpression(expNode, context))
  } else {
    return useExpression(node, context)
  }
}

class Context {
  variables = new Map<string, string>()
  types = new Map<string, string>()

  constructor(public parent: Context | undefined, private scope: string | undefined, public prepend: (n: ts.Node) => void) {}

  private _getTop(current: Context): Context {
    return current.parent ? this._getTop(current.parent) : current
  }

  _findVariable(context: Context, nodeId: string): null | string {
    const found = context.variables.get(nodeId)

    if (found) return found
    return context.parent ? this._findVariable(context.parent, nodeId) : null
  }

  findVariable(nodeId: string) {
    const v = this._findVariable(this, nodeId)

    return v
  }

  _findType(context: Context, nodeId: string): null | string {
    const found = context.types.get(nodeId)

    if (found) return found
    return context.parent ? this._findVariable(context.parent, nodeId) : null
  }

  findType(nodeId: string) {
    const v = this._findType(this, nodeId)

    return v
  }

  addVariable(nodeId: string, name: string) {
    this.variables.set(nodeId, name)
  }

  addType(nodeId: string, name: string) {
    this.types.set(nodeId, name)
  }

  getTop() {
    return this._getTop(this)
  }

  isBelong(node: NodeSingular) {
    return node.data('parent') === this.scope
  }

  static findBelongingContext(node: NodeSingular, context: Context): Context | null {
    const parent = context.getParent()

    if (context.isBelong(node)) return context
    if (parent) return Context.findBelongingContext(node, parent)
    return null
  }


  getParent() {
    return this.parent
  }
}

export async function graphToAst(graph: Core) {
  const rootLeaves = graph.elements().leaves().filter(n => !n.data('parent'))

  const sourceFile = ts.createSourceFile('file.ts', '', ts.ScriptTarget.ES2020)
  const printer = ts.createPrinter({
    newLine: ts.NewLineKind.LineFeed
  })
  const context = new Context(undefined, undefined, node => {
    console.log(printer.printNode(ts.EmitHint.Unspecified, node, sourceFile))
  })
  rootLeaves.forEach(n => {
    const node = processNode(n, context)

    if (node) {
      console.log(printer.printNode(ts.EmitHint.Unspecified, node, sourceFile))
    }
  })

  console.log(sourceFile.getText())
}
