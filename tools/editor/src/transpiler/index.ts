import {
  Node as ASTNode, Statement, Expression, ObjectExpression, ObjectProperty, BinaryExpression,
  CallExpression, MemberExpression, SpreadElement, JSXNamespacedName, ArgumentPlaceholder,
  Identifier, ConditionalExpression, FunctionDeclaration, ArrowFunctionExpression,
  FunctionExpression, Literal, TSType, TypeAnnotation, TSTypeAnnotation, Noop
} from '@babel/types'

export type Graph = {
  addNode(data: Record<string, any>): Promise<{ id: string }>
  addEdge(source: string, target: string,  data: Record<string, any>): Promise<{ id: string }>
  findIdentifier(name: string, prop: 'identifier' | 'typeIdentifier', parent: Scope): Promise<null | { id: string }>
  patchData(id: string, data: Record<string, any>): Promise<void>
}
export type Scope = string | undefined


function getValue(exp: Expression | SpreadElement | JSXNamespacedName | ArgumentPlaceholder) {
  const literal = ['StringLiteral', 'NumericLiteral', 'BooleanLiteral']

  if (!literal.includes(exp.type)) return
  return 'value' in exp ? exp.value : null
}

function isNode(arg: any): arg is ({ id: string }) {
  return arg && typeof arg === 'object' && 'id' in arg
}

async function processObject(exp: ObjectExpression, parent: Scope, editor: Graph): Promise<{ id: string }> {
  const properties = exp.properties
    .filter((p): p is ObjectProperty => p.type === 'ObjectProperty' && p.key.type === 'Identifier')

  const { id } = await editor.addNode({ parent, type: 'Object', label: 'object', properties: properties.map(p => (p.key as Identifier).name).join(', ') })

  for (const p of properties) {
    const value =  p.value
    const key =  p.key

    if (key.type === 'Identifier') {
      const identNode = await processExpression(value as Expression, parent, editor) // TOOD

      await editor.addEdge(identNode.id, id, { label: key.name })
    }
  }

  return { id }
}

async function processMember(expression: MemberExpression, parent: Scope, editor: Graph): Promise<{ id: string }> {
  const object = expression.object
  const property = expression.property

  if (property.type === 'Identifier') {
    const { id } = await editor.addNode({ parent, type: 'Member', label: 'property ' + property.name, property: property.name })

    const identNode = await processExpression(object, parent, editor)

    await editor.addEdge(identNode.id, id, { } )
    return { id }
  } else {
    throw new Error('processMember: cannot process object ' + object.type + ' and property ' + property.type)
  }
}

function isLiteral(arg: Expression): arg is Literal {
  return arg.type === 'StringLiteral' || arg.type === 'NumericLiteral' ||  arg.type === 'BooleanLiteral'
}

async function processLiteral(arg: Literal, parent: Scope, editor: Graph) {
  return editor.addNode({ parent, type: 'Literal', label: getValue(arg) })
}

async function processCall(expression: CallExpression, parent: Scope, editor: Graph): Promise<{ id: string }> {
  const args = await Promise.all(expression.arguments.map(arg => {
    if (arg.type === 'SpreadElement' || arg.type === 'JSXNamespacedName' || arg.type === 'ArgumentPlaceholder') return null

    return processExpression(arg, parent, editor)
  }))
  const { id } = await editor.addNode({ parent, type: 'Call', label: 'call', arguments: args.map(arg => isNode(arg) ? '' : arg)})

  await Promise.all(args.map(async (arg, i) => {
    if (isNode(arg)) {
      await editor.addEdge(arg.id, id, { label: 'argument ' + i })
    }
  }))

  if (expression.typeParameters) {
    await Promise.all(expression.typeParameters.params.map(async (p, i) => {
      const typeNode = await processType(p, parent, editor)

      await editor.addEdge(typeNode.id, id, { label: 'type ' + i })
    }))
  }

  if (expression.callee.type !== 'V8IntrinsicIdentifier') {
    const calleNode = await processExpression(expression.callee, parent, editor)

    await editor.addEdge(calleNode.id, id, { label: 'function' })
  } else {
    throw new Error('cannot process CallExpression\'s callee')
  }

  return { id }
}

async function processBinary(statement: BinaryExpression, parent: Scope, editor: Graph): Promise<{ id: string }> {
  const { left, right } = statement
  const { id } = await editor.addNode({ parent, type: 'BinaryOperator', label: statement.operator,
    op: statement.operator
  })

  if (left.type !== 'PrivateName') {
    const identExp = await processExpression(left, parent, editor)

    await editor.addEdge(identExp.id, id, { label: 'left' })
  }
  const rightExp = await processExpression(right, parent, editor)

  await editor.addEdge(rightExp.id, id, { label: 'right' })

  return { id }
}

async function processConditional(expression: ConditionalExpression, parent: Scope, editor: Graph): Promise<{ id: string }> {
  const { id } = await editor.addNode({ parent, type: 'Conditional', label: 'if' })

  const testNode = await processExpression(expression.test, parent, editor)

  await editor.addEdge(testNode.id, id, {})

  const consequentExp = await processExpression(expression.consequent, parent, editor)

  await editor.addEdge(consequentExp.id, id, { label: 'then' })

  const alternateExp = await processExpression(expression.alternate, parent, editor)

  await editor.addEdge(alternateExp.id, id, { label: 'else' })

  return { id }
}

async function processExpression(expression: Expression, parent: Scope, editor: Graph): Promise<{ id: string }> {
  if (expression.type === 'CallExpression') {
    return processCall(expression, parent, editor)
  }
  if (expression.type === 'MemberExpression') {
    return processMember(expression, parent, editor)
  }
  if (expression.type === 'BinaryExpression') {
    return processBinary(expression, parent, editor)
  }
  if (expression.type === 'ConditionalExpression') {
    return processConditional(expression, parent, editor)
  }
  if (expression.type === 'Identifier') {
    const node = await editor.findIdentifier(expression.name, 'identifier', parent)

    if (!node) throw new Error(`cannot find Identifier "${expression.name}"`)
    return node
  }
  if (expression.type === 'ArrowFunctionExpression') {
    return processFunction(expression, parent, editor)
  } else if (expression.type === 'FunctionExpression') {
    return processFunction(expression, parent, editor)
  }
  if (expression.type === 'ObjectExpression') {
    return processObject(expression, parent, editor)
  }
  if (isLiteral(expression)) {
    return processLiteral(expression, parent, editor)
  }
  throw new Error('processExpression: cannot process ' + expression.type)
}

async function processType(statement: TSType | TypeAnnotation | TSTypeAnnotation | Noop, parent: Scope, editor: Graph): Promise<{ id: string }> {
  if (statement.type === 'TSUnionType' || statement.type === 'TSIntersectionType') {
    const type = statement.type.replace(/TS(.*)Type/, '$1')
    const { id } = await editor.addNode({ parent, type: type + 'Type', label: type.toLowerCase() + ' type' })

    for (const type of statement.types) {
      const typeNode = await processType(type, parent, editor)

      await editor.addEdge(typeNode.id, id, {})
    }
    return { id }
  } else if (statement.type === 'TSParenthesizedType') {
    return processType(statement.typeAnnotation, parent, editor)
  } else if (statement.type === 'TSTypeAnnotation') {
    return processType(statement.typeAnnotation, parent, editor)
  } else if (['TSNumberKeyword', 'TSStringKeyword', 'TSBooleanKeyword'].includes(statement.type)) {
    const type = statement.type.replace(/TS(.*)Keyword/, '$1')

    return editor.addNode({ parent, type: type + 'Type', label: type.toLowerCase() + ' type' })
  } else if (statement.type === 'TSTypeReference' && statement.typeName.type === 'Identifier') {
    const ident = await editor.findIdentifier(statement.typeName.name, 'typeIdentifier', parent)

    if (!ident) throw new Error('cannot find type identifier')
    return ident
  } else {
    throw new Error('cannot process processType: ' + statement.type)
  }
}

async function processNode(statement: Statement | Expression, parent: Scope, editor: Graph): Promise<void> {
  if (statement.type === 'ImportDeclaration') {
    const module = statement.source.value

    const specifiers = statement.specifiers.map(s => {
      if (s.type !== 'ImportSpecifier') throw new Error('ImportDeclaration: cannot process ImportDefaultSpecifier or ImportNamespaceSpecifier')
      return {
        source: 'value' in s.imported ? s.imported.value : s.imported.name,
        local: s.local.name
      }
    })

    for (const specifier of specifiers) {
      await editor.addNode({
        parent,
        type: 'ImportDeclaration',
        label: 'import ' + specifier?.local,
        identifier: specifier?.local,
        typeIdentifier: specifier?.local,
        module,
        source: specifier?.source
      })
    }
  } else if (statement.type === 'VariableDeclaration') {
    for (const declarator of statement.declarations) {
      if (declarator.id.type !== 'Identifier') throw new Error('VariableDeclaration: id should be Identifier')
      if (!declarator.init) {
        console.info('Skipped VariableDeclaration without "init"')
        continue
      }

      if (isLiteral(declarator.init)) {
        const value = getValue(declarator.init)

        await editor.addNode({ parent, type: 'VariableDeclaration', label: value, value, identifier: declarator.id.name })
      } else {
        const expNode = await processExpression(declarator.init, parent, editor)

        await editor.patchData(expNode.id, { identifier: declarator.id.name })
      }
    }
  } else if (statement.type === 'ExpressionStatement') {
    await processExpression(statement.expression, parent, editor)
  } else if (statement.type === 'ReturnStatement') {
    const { id } = await editor.addNode({ parent, type: 'Return', label: 'return' })

    if (statement.argument) {
      const expNode = await processExpression(statement.argument, parent, editor)

      await editor.addEdge(expNode.id, id, {})
    }
  } else if (statement.type === 'FunctionDeclaration') {
    await processFunction(statement, parent, editor)
  } else if (statement.type === 'BlockStatement') {
    for (const item of statement.body) {
      await processNode(item, parent, editor)
    }
  } else if (statement.type === 'ExportNamedDeclaration') {
  } else if (statement.type === 'TSTypeAliasDeclaration') {
    const { id } = await editor.addNode({
      parent,
      type: 'Type',
      label: 'type',
      typeIdentifier: statement.id.name
    })

    const type = await processType(statement.typeAnnotation, parent, editor)

    await editor.addEdge(type.id, id, {})
  } else {
    throw new Error('processNode: cannot process statement ' + statement.type)
  }
}

async function processFunction(expression: FunctionDeclaration | ArrowFunctionExpression | FunctionExpression, parent: Scope, editor: Graph): Promise<{ id: string }> {
  const { id } = await editor.addNode({
    parent,
    type: 'FunctionDeclaration',
    label: expression.type === 'FunctionDeclaration' ? expression.id?.name : 'function',
    identifier: expression.type === 'FunctionDeclaration' ? expression.id?.name : null
  })

  for (const statement of expression.params) {
    if (statement.type !== 'Identifier') throw new Error('FunctionDeclaration: cannot process ' + statement.type)
    const { name } = statement
    const index = expression.params.indexOf(statement)

    const statementNope = await editor.addNode({ parent: id, type: 'ParameterDeclaration', label: 'parameter ' + index, name, identifier: name })

    if (statement.typeAnnotation) {
      const typeAnnotationNode = await processType(statement.typeAnnotation, parent, editor)

      await editor.addEdge(typeAnnotationNode.id, statementNope.id, { label: 'type' })
    }
  }

  if (expression.body.type === 'BlockStatement') {
    for (const statement of expression.body.body) {
      await processNode(statement, id, editor)
    }
  } else {
    const { id: returnId } = await editor.addNode({ parent: id, type: 'Return', label: 'return' })

    const expNode = await processExpression(expression.body, id, editor)

    await editor.addEdge(expNode.id, returnId, {})
  }

  return { id }
}

export async function process(node: ASTNode, editor: Graph) {
  if (node.type === 'File') {
    for (const statement of node.program.body) {
      await processNode(statement, undefined, editor)
    }
  } else {
    throw new Error('process: cannot process ' + node.type)
  }
}
