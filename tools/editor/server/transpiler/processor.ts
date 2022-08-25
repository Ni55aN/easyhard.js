import { Graph, Scope } from './types'
import ts, { Node, SyntaxKind } from 'typescript'

type Context = {
  parent?: Scope
  graph: Graph
}

async function processCall(expression: ts.CallExpression, context: Context): Promise<{ id: string }> {
  const { graph, parent } = context
  const { id } = await graph.addNode({ parent, type: 'Call', label: 'call' })

  const args = await Promise.all(expression.arguments.map(arg => {
    return processExpression(arg, context)
  }))

  await Promise.all(args.map(async (arg, i) => {
    await graph.addEdge(arg.id, id, { label: 'argument ' + i })
  }))

  if (expression.typeArguments) {
    await Promise.all(expression.typeArguments.map(async (p, i) => {
      const typeNode = await processType(p, context)

      await graph.addEdge(typeNode.id, id, { label: 'type ' + i })
    }))
  }

  const calleNode = await processExpression(expression.expression, context)

  await graph.addEdge(calleNode.id, id, { label: 'function' })

  return { id }
}

function isLiteral(arg: ts.Expression): arg is ts.LiteralExpression {
  return ts.isStringLiteral(arg) || ts.isNumericLiteral(arg)
}

async function processLiteral(arg: ts.LiteralExpression, context: Context) {
  const { graph, parent } = context

  return graph.addNode({ parent, type: 'Literal', label: arg.text })
}

async function processObject(exp: ts.ObjectLiteralExpression, context: Context): Promise<{ id: string }> {
  const { graph, parent } = context
  const { id } = await graph.addNode({ parent, type: 'Object', label: 'object' })

  for (const p of exp.properties) {
    if (!ts.isPropertyAssignment(p)) throw new Error('property should be an assignment')
    if (!p.name || !ts.isIdentifier(p.name)) throw new Error('property name should be an identifier')

    const value =  p.initializer
    const key =  p.name

    const identNode = await processExpression(value, context)

    await graph.addEdge(identNode.id, id, { label: key.escapedText })
  }

  return { id }
}

const typeKeywordMap: {[kind in SyntaxKind]?: string} = {
  [SyntaxKind.NumberKeyword]: 'Number',
  [SyntaxKind.StringKeyword]: 'String',
  [SyntaxKind.BooleanKeyword]: 'Boolean'
}

async function processType(statement: ts.TypeNode, context: Context): Promise<{ id: string }> {
  const { graph, parent } = context

  if (ts.isUnionTypeNode(statement) || ts.isIntersectionTypeNode(statement)) {
    const type = ts.isUnionTypeNode(statement) ? 'Union' : 'Intersection'
    const { id } = await graph.addNode({ parent, type: type + 'Type', label: type.toLowerCase() + ' type' })

    for (const type of statement.types) {
      const typeNode = await processType(type, context)

      await graph.addEdge(typeNode.id, id, {})
    }
    return { id }
  } else if ([SyntaxKind.NumberKeyword, SyntaxKind.StringKeyword, SyntaxKind.BooleanKeyword].includes(statement.kind)) {
    const type = typeKeywordMap[statement.kind] || '?'

    return graph.addNode({ parent, type: type + 'Type', label: type.toLowerCase() + ' type' })
  } else if (ts.isTypeReferenceNode(statement) && ts.isIdentifier(statement.typeName)) {
    const ident = await graph.findIdentifier(String(statement.typeName.escapedText), 'typeIdentifier', parent)

    if (!ident) throw new Error('cannot find type identifier')
    return ident
  } else {
    debugger
    throw new Error('cannot process processType: ' + statement.kind)
  }
}

async function processMember(expression: ts.PropertyAccessExpression, context: Context): Promise<{ id: string }> {
  const { graph, parent } = context
  const object = expression.expression
  const property = expression.name

  if (ts.isIdentifier(property)) {
    const { id } = await graph.addNode({ parent, type: 'Member', label: 'property ' + property.escapedText, property: property.escapedText })

    const identNode = await processExpression(object, context)

    await graph.addEdge(identNode.id, id, { } )
    return { id }
  } else {
    throw new Error('processMember: cannot process object ' + object.kind + ' and property ' + property.escapedText)
  }
}

async function processConditional(expression: ts.ConditionalExpression, context: Context): Promise<{ id: string }> {
  const { graph, parent } = context
  const { id } = await graph.addNode({ parent, type: 'Conditional', label: 'if' })

  const testNode = await processExpression(expression.condition, context)

  await graph.addEdge(testNode.id, id, {})

  const consequentExp = await processExpression(expression.whenTrue, context)

  await graph.addEdge(consequentExp.id, id, { label: 'then' })

  const alternateExp = await processExpression(expression.whenFalse, context)

  await graph.addEdge(alternateExp.id, id, { label: 'else' })

  return { id }
}

async function processExpression(expression: ts.Expression, context: Context): Promise<{ id: string }> {
  const { graph, parent } = context

  if (ts.isCallExpression(expression)) {
    return processCall(expression, context)
  } else if (isLiteral(expression)) {
    return processLiteral(expression, context)
  } else if (ts.isIdentifier(expression)) {
    const node = await graph.findIdentifier(String(expression.escapedText), 'identifier', parent)

    if (!node) throw new Error(`cannot find Identifier "${expression}"`)
    return node
  } else if (ts.isBinaryExpression(expression)) {
    return processBinary(expression, context)
  } else if (ts.isPropertyAccessExpression(expression)) {
    return processMember(expression, context)
  } else if (ts.isObjectLiteralExpression(expression)) {
    return processObject(expression, context)
  } else if (ts.isConditionalExpression(expression)) {
    return processConditional(expression, context)
  } else if (ts.isArrowFunction(expression)) {
    return processFunction(expression, context)
  } else {
    debugger
    throw new Error('processExpression for kind ' + expression.kind)
  }
}

const operatorTokenMap: {[kind in SyntaxKind]?: string} = {
  [SyntaxKind.PlusToken]: '+',
  [SyntaxKind.MinusToken]: '-',
  [SyntaxKind.AsteriskToken]: '*',
  [SyntaxKind.SlashToken]: '/',
  [SyntaxKind.GreaterThanEqualsToken]: '>=',
  [SyntaxKind.GreaterThanToken]: '>',
  [SyntaxKind.LessThanEqualsToken]: '<=',
  [SyntaxKind.LessThanToken]: '<',
  [SyntaxKind.EqualsEqualsToken]: '==',
  [SyntaxKind.EqualsEqualsEqualsToken]: '==='
}

async function processBinary(expression: ts.BinaryExpression, context: Context): Promise<{ id: string }> {
  const { graph, parent } = context
  const { left, right } = expression
  const operator = operatorTokenMap[expression.operatorToken.kind] || '?'
  const { id } = await graph.addNode({ parent, type: 'BinaryOperator', label: operator,
    op: operator
  })

  const identExp = await processExpression(left, context)

  await graph.addEdge(identExp.id, id, { label: 'left' })

  const rightExp = await processExpression(right, context)

  await graph.addEdge(rightExp.id, id, { label: 'right' })

  return { id }
}

async function processFunction(expression: ts.FunctionDeclaration | ts.ArrowFunction | ts.FunctionExpression, context: Context): Promise<{ id: string }> {
  const { graph, parent } = context

  const { id } = await graph.addNode({
    parent,
    type: 'FunctionDeclaration',
    label:  expression.name?.escapedText || 'function',
    identifier: expression.name?.escapedText || null
  })
  for (const statement of expression.parameters) {
    if (!ts.isIdentifier(statement.name)) throw new Error('FunctionDeclaration: cannot process ' + statement.kind)

    const name = statement.name.escapedText
    const index = expression.parameters.indexOf(statement)

    const statementNope = await graph.addNode({ parent: id, type: 'ParameterDeclaration', label: 'parameter ' + index, name, identifier: name })

    if (statement.type) {
      const typeAnnotationNode = await processType(statement.type, context)

      await graph.addEdge(typeAnnotationNode.id, statementNope.id, { label: 'type' })
    }
  }

  if (!expression.body) throw new Error('function should have a body')

  if (ts.isBlock(expression.body)) {
    for (const statement of expression.body.statements) {
      await processNode(statement, { ...context, parent: id })
    }
  } else {
    const { id: returnId } = await graph.addNode({ parent: id, type: 'Return', label: 'return' })

    const expNode = await processExpression(expression.body, { ...context, parent: id })

    await graph.addEdge(expNode.id, returnId, {})
  }

  return { id }
}

async function processNode(node: Node, context: Context) {
  const { graph, parent } = context

  if (node.kind === SyntaxKind.SyntaxList) {
    for (const n of node.getChildren()) {
      await processNode(n, context)
    }
  } else if (ts.isImportDeclaration(node)) {
    const { moduleSpecifier, importClause } = node

    if (!ts.isStringLiteral(moduleSpecifier)) throw new Error('imported module name should be literal')
    if (!importClause?.namedBindings || !ts.isNamedImports(importClause.namedBindings)) throw new Error('import should have only named bindings')
    const module = moduleSpecifier.text

    for (const binding of importClause.namedBindings.elements) {
      const local = binding.name.escapedText
      const source = binding.propertyName?.escapedText
      await graph.addNode({
        parent,
        type: 'ImportDeclaration',
        label: 'import ' + local,
        identifier: local,
        typeIdentifier: local,
        module,
        source
      })
    }
  } else if (node.kind === SyntaxKind.FirstStatement) {
    for (const child of node.getChildren()) {
      await processNode(child, context)
    }
  } else if (ts.isVariableDeclarationList(node)) {
    for (const declaration of node.declarations) {
      await processNode(declaration, context)
    }
  } else if (ts.isVariableDeclaration(node)) {
    if (!node.initializer) {
      console.info('Skipped VariableDeclaration without "initializer"')
      return
    }
    if (!ts.isIdentifier(node.name)) throw new Error('variable declaration should have name of identifier kind')
    const identifier = node.name.escapedText
    if (ts.isLiteralExpression(node.initializer)) {
      const value = node.initializer.text

      await graph.addNode({ parent, type: 'VariableDeclaration', label: value, value, identifier })
    } else {
      const expNode = await processExpression(node.initializer, context)

      await graph.patchData(expNode.id, { identifier })
    }
  } else if (ts.isFunctionDeclaration(node)) {
    return processFunction(node, context)
  } else if (ts.isReturnStatement(node)) {
    const { id } = await graph.addNode({ parent, type: 'Return', label: 'return' })

    if (node.expression) {
      const expNode = await processExpression(node.expression, context)

      await graph.addEdge(expNode.id, id, {})
    }
  } else if (ts.isExpressionStatement(node)) {
    return processExpression(node.expression, context)
  } else if (ts.isTypeAliasDeclaration(node)) {
    const { id } = await graph.addNode({
      parent,
      type: 'Type',
      label: 'type',
      typeIdentifier: node.name.escapedText
    })
    const type = await processType(node.type, context)

    await graph.addEdge(type.id, id, {})
  } else if (ts.isExportDeclaration(node)) {
  } else if (node.kind === SyntaxKind.EndOfFileToken) {
  } else {
    throw new Error('processNode: cannot process ' + node.kind)
  }
}

export async function process(node: Node, context: Context) {
  if (ts.isSourceFile(node)) {
    for (const statement of node.getChildren()) {
      await processNode(statement, context)
    }
  } else {
    throw new Error('process: cannot process ' + node.kind)
  }
}
