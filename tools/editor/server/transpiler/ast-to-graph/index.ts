import { Graph, KeywordType } from '../types'
import ts, { Node, NodeArray, SyntaxKind, TypeParameterDeclaration } from 'typescript'
import { tokenToString } from '../tokens'
import { getLiteralValue, isLiteral } from './literal-utils'
import { Context } from './context'
import { TypeChecker } from '../type-checker'

async function processCall(expression: ts.CallExpression, context: Context): Promise<{ id: string }> {
  const { graph, parent } = context
  const { id } = await graph.addNode({
    parent,
    type: 'Call',
    label: 'call',
    ...context.checker.getTyping(expression)
  })

  const args = await Promise.all(expression.arguments.map(arg => {
    return processExpression(arg, context)
  }))

  await Promise.all(args.map(async (arg, i) => {
    await graph.addEdge(arg.id, id, { label: 'argument ' + i, index: i, type: 'Argument' })
  }))

  if (expression.typeArguments) {
    await Promise.all(expression.typeArguments.map(async (p, i) => {
      const typeNode = await processType(p, context)

      await graph.addEdge(typeNode.id, id, { label: 'type ' + i, type: 'GenericType', index: i - 5 })
    }))
  }

  const calleNode = await processExpression(expression.expression, context)

  await graph.addEdge(calleNode.id, id, { label: 'function', index: -1 })

  return { id }
}

async function processLiteral(arg: ts.LiteralExpression, context: Context) {
  const { graph, parent } = context
  const value = getLiteralValue(arg)

  return graph.addNode({
    parent,
    type: 'Literal',
    label: String(value),
    value,
    ...context.checker.getTyping(arg)
  })
}

async function processObject(exp: ts.ObjectLiteralExpression, context: Context): Promise<{ id: string }> {
  const { graph, parent } = context
  const { id } = await graph.addNode({
    parent,
    type: 'Object',
    label: 'object',
    ...context.checker.getTyping(exp)
  })

  for (const p of exp.properties) {
    if (!ts.isPropertyAssignment(p)) throw new Error('property should be an assignment')
    if (!p.name || !ts.isIdentifier(p.name)) throw new Error('property name should be an identifier')

    const value =  p.initializer
    const key =  p.name

    const identNode = await processExpression(value, context)

    await graph.addEdge(identNode.id, id, { label: key.escapedText, index: 0 })
  }

  return { id }
}

const typeKeywordMap: {[kind in SyntaxKind]?: KeywordType} = {
  [SyntaxKind.NumberKeyword]: 'Number',
  [SyntaxKind.StringKeyword]: 'String',
  [SyntaxKind.BooleanKeyword]: 'Boolean',
  [SyntaxKind.NullKeyword]: 'Null'
}

async function processType(statement: ts.TypeNode, context: Context): Promise<{ id: string }> {
  const { graph, parent } = context

  if (ts.isUnionTypeNode(statement) || ts.isIntersectionTypeNode(statement)) {
    const type = ts.isUnionTypeNode(statement) ? 'Union' : 'Intersection'
    const { id } = await graph.addNode({
      parent,
      type: `${type}Type`,
      label: type.toLowerCase() + ' type',
      ...context.checker.getTyping(statement)
    })

    for (const type of statement.types) {
      const typeNode = await processType(type, context)
      const index = statement.types.indexOf(type)

      await graph.addEdge(typeNode.id, id, { index: index - 10 })
    }
    return { id }
  } else if ([SyntaxKind.NumberKeyword, SyntaxKind.StringKeyword, SyntaxKind.BooleanKeyword, SyntaxKind.NullKeyword].includes(statement.kind)) {
    const type = typeKeywordMap[statement.kind]

    return graph.addNode({
      parent,
      type: type ? `${type}Type` : '?',
      label: (type || '?').toLowerCase() + ' type',
      ...context.checker.getTyping(statement)
    })
  } else if (ts.isTypeReferenceNode(statement) && ts.isIdentifier(statement.typeName)) {
    const ident = await graph.findIdentifier(String(statement.typeName.escapedText), 'typeIdentifiers', parent)
    if (!ident) throw new Error('cannot find type identifier')

    if (statement.typeArguments) {
      const node = await graph.addNode({
        parent,
        type: 'GenericCall',
        label: 'generic',
        ...context.checker.getTyping(statement)
      })

      await graph.addEdge(ident.id, node.id, { type: 'GenericType', index: -10 })

      for (const arg of statement.typeArguments) {
        const typeNode = await processType(arg, context)
        const index = statement.typeArguments.indexOf(arg)

        await graph.addEdge(typeNode.id, node.id, { label: `type ${index}`, type: 'TypeArgument', index: -index })
      }

      return node
    }
    return ident
  } else if (ts.isTypeLiteralNode(statement)) {
    const { id } = await graph.addNode({
      parent,
      type: 'ObjectType',
      label: 'object type',
      ...context.checker.getTyping(statement)
    })
    for (const member of statement.members) {
      if (!ts.isPropertySignature(member)) throw new Error('TODO')
      if (!ts.isIdentifier(member.name)) throw new Error('should be an identifier')
      if (!member.type) throw new Error('type expected')

      const index = statement.members.indexOf(member)
      const propertyNode = await processType(member.type, context)

      await graph.addEdge(propertyNode.id, id, { label: member.name.escapedText, index })
    }

    return { id }
  } else if (ts.isFunctionTypeNode(statement)) {
    const { id, scopeContext } = await createTypeScope('FuncType', statement.typeParameters, statement.type, context)

    await processFunctionParameters(statement.parameters, scopeContext)

    return { id }
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
    const { id } = await graph.addNode({
      parent,
      type: 'Member',
      label: 'property ' + property.escapedText,
      ...context.checker.getTyping(expression),
      property: String(property.escapedText)
    })

    const identNode = await processExpression(object, context)

    await graph.addEdge(identNode.id, id, { index: 0 })
    return { id }
  } else {
    throw new Error('processMember: cannot process object ' + object.kind + ' and property ' + property.escapedText)
  }
}

async function processConditional(expression: ts.ConditionalExpression, context: Context): Promise<{ id: string }> {
  const { graph, parent } = context
  const { id } = await graph.addNode({
    parent,
    type: 'Conditional',
    label: 'if',
    ...context.checker.getTyping(expression)
  })

  const testNode = await processExpression(expression.condition, context)

  await graph.addEdge(testNode.id, id, { index: 0 })

  const consequentExp = await processExpression(expression.whenTrue, context)

  await graph.addEdge(consequentExp.id, id, { label: 'then', index: 1 })

  const alternateExp = await processExpression(expression.whenFalse, context)

  await graph.addEdge(alternateExp.id, id, { label: 'else', index: 2 })

  return { id }
}

async function processExpression(expression: ts.Expression, context: Context): Promise<{ id: string }> {
  const { graph, parent } = context

  if (ts.isCallExpression(expression)) {
    return processCall(expression, context)
  } else if (isLiteral(expression)) {
    return processLiteral(expression, context)
  } else if (ts.isIdentifier(expression)) {
    const node = await graph.findIdentifier(String(expression.escapedText), 'identifiers', parent)

    if (!node) throw new Error(`cannot find Identifier "${expression.escapedText}"`)
    return node
  } else if (ts.isBinaryExpression(expression)) {
    return processBinary(expression, context)
  } else if (ts.isPropertyAccessExpression(expression)) {
    return processMember(expression, context)
  } else if (ts.isObjectLiteralExpression(expression)) {
    return processObject(expression, context)
  } else if (ts.isConditionalExpression(expression)) {
    return processConditional(expression, context)
  } else if (ts.isFunctionExpression(expression)) {
    return processFunction(expression, context)
  } else if (ts.isArrowFunction(expression)) {
    return processFunction(expression, context)
  } else {
    debugger
    throw new Error('processExpression for kind ' + expression.kind)
  }
}

async function processBinary(expression: ts.BinaryExpression, context: Context): Promise<{ id: string }> {
  const { graph, parent } = context
  const { left, right } = expression
  const operator = tokenToString(expression.operatorToken) || '?'
  const { id } = await graph.addNode({
    parent,
    type: 'BinaryOperator',
    label: operator,
    ...context.checker.getTyping(expression),
    op: operator
  })

  const identExp = await processExpression(left, context)

  await graph.addEdge(identExp.id, id, { label: 'left', index: 0 })

  const rightExp = await processExpression(right, context)

  await graph.addEdge(rightExp.id, id, { label: 'right', index: 1 })

  return { id }
}

async function processFunction(expression: ts.FunctionDeclaration | ts.ArrowFunction | ts.FunctionExpression, context: Context): Promise<{ id: string, identifier?: string }> {
  const { graph, parent } = context
  const { name, body } = expression
  const identifier = name ? String(name.escapedText) : undefined

  const { id } = await graph.addNode({
    parent,
    type: 'FunctionDeclaration',
    label: name ? String(name.escapedText) : 'function',
    ...context.checker.getTyping(expression),
    identifiers: identifier ? [identifier] : []
  })
  const functionContext = context.getSubcontext(id)

  await processTypeParameters(expression.typeParameters, functionContext)
  await processFunctionParameters(expression.parameters, functionContext)

  if (!body) throw new Error('function should have a body')

  context.addDeffered(async () => {
    if (ts.isBlock(body)) {
      for (const statement of body.statements) {
        await processNode(statement, functionContext)
      }
      await functionContext.flushDeffered()
    } else {
      const { id: returnId } = await graph.addNode({
        parent: id,
        type: 'Return',
        label: 'return',
        ...context.checker.getTyping(expression)
      })

      const expNode = await processExpression(body, functionContext)

      await graph.addEdge(expNode.id, returnId, { index: 0 })
      await functionContext.flushDeffered()
    }
  })

  return { id, identifier }
}

function hasExportModifier(statement: ts.Statement) {
  return statement.modifiers?.find(m => m.kind === SyntaxKind.ExportKeyword)
}

async function addExport(statements: { id: string, identifier?: string }[], context: Context) {
  const { graph } = context
  const list: { id: string }[] = []

  for (const statement of statements) {
    if (!statement.identifier) throw new Error('identifier is undefined')
    const { id } = await graph.addNode({
      type: 'Export',
      label: `export ${statement.identifier}`,
      typingKind: null,
      name: statement.identifier,
      typingText: ''
    })
    await graph.addEdge(statement.id, id, { index: 0 })
    list.push({ id })
  }

  return list
}

async function addImport(name: ts.Identifier, source: string | undefined, module: string, context: Context) {
  const { graph, parent } = context
  const local = String(name.escapedText)

  const ident = await graph.findIdentifier(local, 'identifiers', parent)

  if (ident && (await graph.getData(ident.id)).type === 'ImportDeclaration') return {
    id: ident.id,
    identifier: local
  }

  const node = await graph.addNode({
    parent,
    type: 'ImportDeclaration',
    label: 'import ' + local,
    ...context.checker.getTyping(name),
    identifiers: [local],
    typeIdentifiers: [local],
    module,
    source
  })

  return {
    id: node.id,
    identifier: local
  }
}

async function processFunctionParameters(parameters: NodeArray<ts.ParameterDeclaration>, context: Context) {
  const { graph, parent } = context

  for (const parameter of parameters) {
    const index = parameters.indexOf(parameter)

    if (!ts.isIdentifier(parameter.name)) throw new Error('FunctionDeclaration: cannot process ' + parameter.kind)
    const name = String(parameter.name.escapedText)

    const parameterNode = await graph.addNode({
      parent,
      type: 'ParameterDeclaration',
      label: 'parameter ' + index,
      index,
      ...context.checker.getTyping(parameter),
      name,
      identifiers: [name]
    })

    if (!parameter.type) throw new Error('parameter should have type')

    const typeAnnotationNode = await processType(parameter.type, context)

    await graph.addEdge(typeAnnotationNode.id, parameterNode.id, { label: 'type', index })
  }
}

async function processTypeParameters(typeParameters: NodeArray<TypeParameterDeclaration> | undefined, context: Context) {
  const { graph, parent } = context
  if (!typeParameters) return

  for (const typeParameter of typeParameters) {
    const index = typeParameters.indexOf(typeParameter)
    const name = String(typeParameter.name.escapedText)

    await graph.addNode({
      parent,
      type: 'GenericParameter',
      label: 'generic parameter ' + index,
      index,
      name,
      typeIdentifiers: [name],
      ...context.checker.getTyping(typeParameter)
    })
  }
}

async function createTypeScope(nodeType: 'TypeScope' | 'FuncType', typeParameters: NodeArray<TypeParameterDeclaration> | undefined, type: ts.TypeNode, context: Context) {
  const { graph, parent } = context
  const typeScopeNode = await graph.addNode({
    parent,
    type: nodeType,
    label: nodeType === 'TypeScope' ? 'scope type' : 'function type',
    typeIdentifiers: [],
    typingKind: null,
    typingText: ''
  })
  const returnNode = await graph.addNode({
    parent: typeScopeNode.id,
    type: 'ReturnType',
    label: 'return type',
    typingKind: null,
    typingText: ''
  })
  const scopeContext = context.getSubcontext(typeScopeNode.id)

  await processTypeParameters(typeParameters, scopeContext)

  const { id } = await processType(type, scopeContext)
  await graph.addEdge(id, returnNode.id, { index: 0 })

  return { id: typeScopeNode.id, scopeContext }
}

async function processNode(node: Node, context: Context): Promise<{ id: string, identifier?: string }[]> {
  const { graph, parent } = context

  if (ts.isImportDeclaration(node)) {
    const { moduleSpecifier, importClause } = node

    if (!ts.isStringLiteral(moduleSpecifier)) throw new Error('imported module name should be literal')
    if (!importClause?.namedBindings || !ts.isNamedImports(importClause.namedBindings)) throw new Error('import should have only named bindings')
    const module = moduleSpecifier.text
    const list: { id: string }[] = []

    for (const binding of importClause.namedBindings.elements) {
      const source = binding.propertyName ? String(binding.propertyName.escapedText) : undefined

      list.push(await addImport(binding.name, source, module, context))
    }

    return list
  } else if (ts.isVariableStatement(node)) {
    const statements = await processNode(node.declarationList, context)

    if (hasExportModifier(node)) {
      return [...statements, ...await addExport(statements, context)]
    }
    return statements
  } else if (ts.isVariableDeclarationList(node)) {
    const statements: { id: string }[] = []
    for (const declaration of node.declarations) {
      statements.push(...await processNode(declaration, context))
    }
    return statements
  } else if (ts.isVariableDeclaration(node)) {
    if (!node.initializer) {
      console.info('Skipped VariableDeclaration without "initializer"')
      return []
    }
    if (!ts.isIdentifier(node.name)) throw new Error('variable declaration should have name of identifier kind')
    const identifier = String(node.name.escapedText)
    const expNode = await processExpression(node.initializer, context)
    const formerIdentifiers = (await graph.getData(expNode.id)).identifiers || []

    await graph.patchData(expNode.id, { identifiers: [...formerIdentifiers, identifier] })

    return [{ id: expNode.id, identifier }]
  } else if (ts.isFunctionDeclaration(node)) {
    const statement = await processFunction(node, context)

    if (hasExportModifier(node)) {
      return [statement, ...await addExport([statement], context)]
    }
    return [statement]
  } else if (ts.isReturnStatement(node)) {
    const { id } = await graph.addNode({
      parent,
      type: 'Return',
      label: 'return',
      ...context.checker.getTyping(node)
    })

    if (node.expression) {
      const expNode = await processExpression(node.expression, context)

      await graph.addEdge(expNode.id, id, { index: 0 })
    }
    return [{ id }]
  } else if (ts.isExpressionStatement(node)) {
    return [await processExpression(node.expression, context)]
  } else if (ts.isTypeAliasDeclaration(node)) {
    if (node.typeParameters) {
      const typeScope = await createTypeScope('TypeScope', node.typeParameters, node.type, context)
      const name = String(node.name.escapedText)

      await graph.patchData(typeScope.id, { typeIdentifiers: [name] })
      return [typeScope]
    } else {
      const type = await processType(node.type, context)
      const identifier = String(node.name.escapedText)
      const formerIdentifiers = (await graph.getData(type.id)).typeIdentifiers || []

      await graph.patchData(type.id, { typeIdentifiers: [...formerIdentifiers, identifier] })

      return [{ id: type.id, identifier }]
    }
  } else if (ts.isExportDeclaration(node)) {
    const { moduleSpecifier, exportClause } = node
    if (!exportClause || exportClause.kind !== SyntaxKind.NamedExports) throw new Error('exportClause')
    const list: { id: string }[] = []

    if (moduleSpecifier) {
      if (!ts.isStringLiteral(moduleSpecifier)) throw new Error('imported module name should be literal')
      const module = moduleSpecifier.text

      for (const element of exportClause.elements) {
        const source = element.propertyName ? String(element.propertyName.escapedText) : undefined

        const importNode = await addImport(element.name, source, module, context)

        list.push(...await addExport([importNode], context))
      }
    } else {
      for (const element of exportClause.elements) {
        const name = element.name.escapedText.toString()
        const ident = await graph.findIdentifier(name, 'identifiers', parent)

        if (!ident) throw new Error('exportClause identifier')

        list.push(...await addExport([{ id: ident.id, identifier: name }], context))
      }
    }

    return list
  } else if ([SyntaxKind.SyntaxList, SyntaxKind.FirstStatement].includes(node.kind)) {
    const list: { id: string, identifier?: string }[] = []
    for (const child of node.getChildren()) {
      list.push(...await processNode(child, context))
    }
    return list
  } else if (node.kind === SyntaxKind.EndOfFileToken) {
    return []
  } else {
    throw new Error('processNode: cannot process ' + node.kind)
  }
}

export async function astToGraph(node: Node, checker: TypeChecker, graph: Graph) {
  if (ts.isSourceFile(node)) {
    const context = new Context(checker, graph)
    for (const statement of node.getChildren()) {
      await processNode(statement, context)
    }
    await context.flushDeffered()
  } else {
    throw new Error('process: cannot process ' + node.kind)
  }
}
