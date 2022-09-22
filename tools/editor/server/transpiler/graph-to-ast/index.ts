import { Core, EdgeCollection, EdgeSingular, NodeCollection, NodeSingular } from 'cytoscape'
import { NodeType, NodeData, Value, TypeNodeData } from '../types'
import ts from 'typescript'
import { stringToToken } from '../tokens'
import { Context } from './context'

const f = ts.factory

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
    if (data.type === 'ImportDeclaration') {
      ctx.addType(node.id(), name)
    }
    ctx.addVariable(node.id(), name)
    useStatement(node, ctx, true)
    return f.createIdentifier(name)
  }

  if (node.outgoers('edge').size() > 1) { // create variable if expression used in multiple places
    ctx.addVariable(node.id(), name)
    if (!ctx.findStatement(node.id())) {
      ctx.addStatement(node.id(), createVariable(name, processExpression(node, ctx)))
    }
    return f.createIdentifier(name)
  }

  if ('identifiers' in data && data.identifiers[0]) { // create variable if it originally has identifier (to keep code in sync with original source code)
    ctx.addVariable(node.id(), data.identifiers[0])
    if (!ctx.findStatement(node.id())) {
      ctx.addStatement(node.id(), createVariable(data.identifiers[0], processExpression(node, ctx)))
    }
    return f.createIdentifier(data.identifiers[0])
  }
  return processExpression(node, ctx)
}

function processExpression(node: NodeSingular, context: Context): ts.Expression {
  const data = node.data() as NodeData
  context.getTop().addProcessed(node, 'expression')

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
  const data = node.data() as TypeNodeData

  context.getTop().addProcessed(node, 'type')

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
        return useType(n, context)
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
  } else if (data.type === 'FuncType') {
    const returnNode = node.incomers('edge[label="return"]').source()

    return f.createFunctionTypeNode(
      [],
      [],
      useType(returnNode, context)
    )
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
  const data = node.data() as TypeNodeData
  const ctx = Context.findBelongingContext(node, context)

  if (!ctx) throw new Error('cannot find context')

  if (ctx.findType(node.id())) {
    return f.createTypeReferenceNode(name)
  }

  if (data.type === 'ImportDeclaration') {
  ctx.addType(node.id(), name)
    useExpression(node, ctx) // force create import
    return f.createTypeReferenceNode(name)
  }

  if (node.outgoers('edge').size() > 1) { // create variable if expression used in multiple places
    ctx.addType(node.id(), name)
    if (!ctx.findStatement(node.id())) {
      ctx.addStatement(node.id(), createTypeAlias(name, processType(node, ctx)))
    }
    return f.createTypeReferenceNode(name)
  }
  if ('typeIdentifiers' in data && data.typeIdentifiers && data.typeIdentifiers[0]) { // create variable if it originally has identifier (to keep code in sync with original source code)
    ctx.addType(node.id(), data.typeIdentifiers[0])
    if (!ctx.findStatement(node.id())) {
      ctx.addStatement(node.id(), createTypeAlias(data.typeIdentifiers[0], processType(node, ctx)))
    }
    return f.createTypeReferenceNode(data.typeIdentifiers[0])
  }

  return processType(node, ctx)
}

function createVariable(name: string, initializer: ts.Expression) {
  const ident = f.createIdentifier(name)
  const dec = f.createVariableDeclaration(ident, undefined, undefined, initializer)

  return f.createVariableStatement(undefined, f.createVariableDeclarationList([dec], ts.NodeFlags.Const))
}

function processStatement(node: NodeSingular, context: Context): ts.Statement {
  const data = node.data() as NodeData | TypeNodeData

  if (data.type === 'VariableDeclaration') {
    context.getTop().addProcessed(node, 'statement')
    const name = getVariableName(node)
    if (data.value === undefined) throw new Error('value should not be undefined')
    const init = getLiteral(data.value)

    return createVariable(name, init)
  } else if (data.type === 'ImportDeclaration') {
    context.getTop().addProcessed(node, 'statement')
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
    context.getTop().addProcessed(node, 'statement')
    const name = getVariableName(node)
    const parameterNodes = node.children().filter(n => (n.data('type') as NodeType) === 'ParameterDeclaration')

    const functionContext = new Context(context, node.id())
    const parameters = parameterNodes.map((n: NodeSingular) => {
      context.getTop().addProcessed(n, 'expression')
      const type = n.incomers('edge[label="type"]').source()
      if (!type) throw new Error('type edge missing')

      return f.createParameterDeclaration(
        undefined,
        undefined,
        undefined,
        f.createIdentifier(n.data('name')),
        undefined,
        useType(type, functionContext),
        undefined
      )
    })

    parameterNodes.forEach(p => {
      functionContext.addVariable(p.id(), p.data('name'))
    })
    traverseNodes(node.children(), n => n.data('parent') === node.id(), functionContext, n => {
      useStatement(n, functionContext)
    })

    return createVariable(name, f.createFunctionExpression(
      undefined,
      undefined,
      undefined,// f.createIdentifier(name),
      undefined,
      parameters,
      undefined,
      f.createBlock(functionContext.getStatements(), true)
    ))
  } else if (data.type === 'Return') {
    context.getTop().addProcessed(node, 'statement')
    const expNode = node.incomers('edge').source()

    return f.createReturnStatement(useExpression(expNode, context))
  } else if (isTypeNode(data)) {
    return f.createTypeAliasDeclaration(
      undefined,
      undefined,
      data.typeIdentifiers ? data.typeIdentifiers[0] : `type_${node.id()}`,
      [],
      processType(node, context)
    )
  } else {
    return f.createExpressionStatement(useExpression(node, context))
  }
}

function createTypeAlias(name: string, type: ts.TypeNode) {
  return f.createTypeAliasDeclaration(
    undefined,
    undefined,
    name,
    [],
    type
  )
}

function isTypeNode(data: NodeData | TypeNodeData): data is TypeNodeData {
  const types = <TypeNodeData['type'][]>['FuncType', 'NumberType', 'StringType', 'BooleanType', 'GenericCall', 'IntersectionType', 'NullType', 'ObjectType', 'UnionType']

  return types.includes(data.type as TypeNodeData['type'])
}

function useStatement(node: NodeSingular, context: Context, prepend = false) {
  if (context.getTop().processedNodes.includes([node.id(), 'statement'].join('_'))) return
  if (context.findStatement(node.id())) return
  const statement = processStatement(node, context)

  context.addStatement(node.id(), statement, prepend)
}

function isUnprocessed(context: Context) {
  return (node: NodeSingular) => {
    const id = node.id()
    return !(context.getTop().processedNodes.includes([id, 'statement'].join('_'))
      || context.getTop().processedNodes.includes([id, 'type'].join('_'))
      || context.getTop().processedNodes.includes([id, 'expression'].join('_')))
  }
}

// get a leaf excluding edges with Call nodes which are more nested in its parents (avoid possible loops)
function getUnaffectedLeaf(nodes: NodeCollection, filter: (node: NodeSingular) => boolean, context: Context) {
  const list = nodes.filter(isUnprocessed(context)).filter(filter).filter((node: NodeSingular) => {
    const parents = node.parents()
    const outgoers = node.outgoers('node').filter(isUnprocessed(context)).filter((outgoer: NodeSingular) => {
      const isCall = outgoer.data('type') === 'Call'
      if (isCall && outgoer.parents().length > parents.length) return false
      return true
    })

   return outgoers.length === 0
  })

  return list[0]
}

function traverseNodes(nodes: NodeCollection, filter: (node: NodeSingular) => boolean, context: Context, match: (node: NodeSingular) => void) {
  let rest: NodeSingular | undefined

  while (rest = getUnaffectedLeaf(nodes, filter, context)) {
    match(rest)
  }
}

export async function graphToAst(graph: Core): Promise<ts.SourceFile> {
  const sourceFile = ts.createSourceFile('file.ts', '', ts.ScriptTarget.ES2020)
  const context = new Context(undefined, undefined)

  traverseNodes(graph.nodes().orphans(), n => !n.data('parent'), context, n => {
    useStatement(n, context)
  })

  return f.updateSourceFile(sourceFile, context.getStatements())
}



