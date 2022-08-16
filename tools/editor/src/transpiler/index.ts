import { $ } from 'easyhard'
import { Core } from 'cytoscape'
import {
  Node as ASTNode, Statement, Expression, ObjectExpression, ObjectProperty, BinaryExpression,
  CallExpression, MemberExpression, SpreadElement, JSXNamespacedName, ArgumentPlaceholder,
  Identifier, ConditionalExpression, FunctionDeclaration, ArrowFunctionExpression,
  FunctionExpression, Literal
} from '@babel/types'

type Graph = Core

function getUID(): string {
  return (Date.now()+Math.random()).toString(36).replace('.', '')
}

type Scope = string | undefined

function getValue(exp: Expression | SpreadElement | JSXNamespacedName | ArgumentPlaceholder) {
  const literal = ['StringLiteral', 'NumericLiteral', 'BooleanLiteral']

  if (!literal.includes(exp.type)) return
  return 'value' in exp ? exp.value : null
}

function isNode(arg: any): arg is ({ id: string }) {
  return arg && typeof arg === 'object' && 'id' in arg
}

function processObject(exp: ObjectExpression, parent: Scope, editor: Graph): { id: string } {
  const properties = exp.properties
    .filter((p): p is ObjectProperty => p.type === 'ObjectProperty' && p.key.type === 'Identifier')


  const id = getUID()
  editor.add({ group: 'nodes', data: { id, parent, type: 'Object', label: 'object', properties: properties.map(p => (p.key as Identifier).name).join(', ') }})

  for (const p of properties) {
    console.log('property', p)
    const value =  p.value
    const key =  p.key

    if (key.type === 'Identifier') {
      const identNode = processExpression(value as Expression, parent, editor) // TOOD

      editor.add({ group: 'edges', data: { id: getUID(), source: identNode.id, target: id, label: key.name }})
    }
  }

  return { id }
}

function processMember(expression: MemberExpression, parent: Scope, editor: Graph): { id: string } {
  const object = expression.object
  const property = expression.property

  if (property.type === 'Identifier') {
    const id = getUID()
    editor.add({ group: 'nodes', data: { id, parent, type: 'Member', label: 'property ' + property.name, property: property.name }})

    const identNode = processExpression(object, parent, editor)

    editor.add({ group: 'edges', data: { id: getUID(), source: identNode.id, target: id } })
    return { id }
  } else {
    throw new Error('processMember: cannot process object ' + object.type + ' and property ' + property.type)
  }
}

function isLiteral(arg: Expression): arg is Literal {
  return arg.type === 'StringLiteral' || arg.type === 'NumericLiteral' ||  arg.type === 'BooleanLiteral'
}

function processLiteral(arg: Literal, parent: Scope, editor: Graph) {
  const id = getUID()

  editor.add({ group: 'nodes', data: { id, parent, type: 'Literal', label: getValue(arg) }})

  return { id }
}

function processCall(expression: CallExpression, parent: Scope, editor: Graph): { id: string } {
  const args = expression.arguments.map(arg => {
    if (arg.type === 'SpreadElement' || arg.type === 'JSXNamespacedName' || arg.type === 'ArgumentPlaceholder') return null

    return processExpression(arg, parent, editor)
  })
  const id = getUID()
  editor.add({ group: 'nodes', data: { id, parent, type: 'Call', label: 'call', arguments: args.map(arg => isNode(arg) ? '' : arg)}})

  args.forEach((arg, i) => {
    if (isNode(arg)) {
      editor.add({ group: 'edges', data: { id: getUID(), source: arg.id, target: id, label: 'argument ' + i }})
    }
  })

  if (expression.callee.type !== 'V8IntrinsicIdentifier') {
    const calleNode = processExpression(expression.callee, parent, editor)

    editor.add({ group: 'edges', data: { id: getUID(), source: calleNode.id, target: id, label: 'function' }})
  } else {
    throw new Error('cannot process CallExpression\'s callee')
  }

  return { id }
}

function processBinary(statement: BinaryExpression, parent: Scope, editor: Graph): { id: string } {
  const { left, right } = statement
  const id = getUID()

  editor.add({ group: 'nodes', data: { id, parent, type: 'BinaryOperator', label: statement.operator,
    op: statement.operator
  }})

  if (left.type !== 'PrivateName') {
    const identExp = processExpression(left, parent, editor)

    editor.add({ group: 'edges', data: { id: getUID(), source: identExp.id, target: id, label: 'left' }})
  }
  const rightExp = processExpression(right, parent, editor)

  editor.add({ group: 'edges', data: { id: getUID(), source: rightExp.id, target: id, label: 'right' }})

  return { id }
}

function processConditional(expression: ConditionalExpression, parent: Scope, editor: Graph): { id: string } {
  const id = getUID()
  const node = editor.add({ group: 'nodes', data: { id, parent, type: 'Conditional', label: 'if', consequent: $(''), alternate: $('') }})

  const testNode = processExpression(expression.test, parent, editor)

  editor.add({ group: 'edges', data: { id: getUID(), source: testNode.id, target: id }})

  const consequentExp = processExpression(expression.consequent, parent, editor)

  editor.add({ group: 'edges', data: { id: getUID(), source: consequentExp.id, target: id, label: 'then' }})

  const alternateExp = processExpression(expression.alternate, parent, editor)

  editor.add({ group: 'edges', data: { id: getUID(), source: alternateExp.id, target: id, label: 'else' }})

  return { id }
}

function findIdentifier(name: string, parent: Scope, editor: Graph): null | { id: string } {
  if (parent) {
    const parentNode = editor.getElementById(parent)
    const found = editor.nodes().filter(n => n.parent() === parentNode && n.data('identifier') === name)

    if (!found.empty()) return { id: found.first().data('id') }
    return findIdentifier(name, parentNode.parent().data('id'), editor)
  }

  const found = editor.nodes().filter(n => n.data('identifier') === name)

  return found.empty() ? null : { id: found.first().data('id') }
}

function processExpression(expression: Expression, parent: Scope, editor: Graph): { id: string } {
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
    const node = findIdentifier(expression.name, parent, editor)

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


function processNode(statement: Statement | Expression, parent: Scope, editor: Graph): void {
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
      const id = getUID()

      editor.add({ group: 'nodes', data: { id, parent, type: 'ImportDeclaration', label: 'import ' + specifier?.local, identifier: specifier?.local, module, source: specifier?.source }})
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
        const id = getUID()
        editor.add({ group: 'nodes', data: { id, parent, type: 'VariableDeclaration', label: value, value, identifier: declarator.id.name }})
      } else {
        const expNode = processExpression(declarator.init, parent, editor)

        editor.nodes().filter(n => n.data('id') === expNode.id).data('identifier', declarator.id.name)
      }
    }
  } else if (statement.type === 'ExpressionStatement') {
    processExpression(statement.expression, parent, editor)
  } else if (statement.type === 'ReturnStatement') {
    const id = getUID()
    editor.add({ group: 'nodes', data: { id, parent, type: 'Return', label: 'return' }})

    if (statement.argument) {
      const expNode = processExpression(statement.argument, parent, editor)

      editor.add({ group: 'edges', data: { id: getUID(), source: expNode.id, target: id }})
    }
  } else if (statement.type === 'FunctionDeclaration') {
    processFunction(statement, parent, editor)
  } else if (statement.type === 'BlockStatement') {
    for (const item of statement.body) {
      processNode(item, parent, editor)
    }
  } else if (statement.type === 'ExportNamedDeclaration') {
  } else {
    throw new Error('processNode: cannot process statement ' + statement.type)
  }
}

function processFunction(expression: FunctionDeclaration | ArrowFunctionExpression | FunctionExpression, parent: Scope, editor: Graph): { id: string } {
  const id = getUID()
  editor.add({ group: 'nodes', data: {
    id,
    parent,
    type: 'FunctionDeclaration',
    label: expression.type === 'FunctionDeclaration' ? expression.id?.name : 'function',
    identifier: expression.type === 'FunctionDeclaration' ? expression.id?.name : null
  }})

  for (const statement of expression.params) {
    if (statement.type !== 'Identifier') throw new Error('FunctionDeclaration: cannot process ' + statement.type)
    const { name } = statement
    const index = expression.params.indexOf(statement)

    editor.add({ group: 'nodes', data: { id: getUID(), parent: id, type: 'ParameterDeclaration', label: 'parameter ' + index, name, identifier: name }})
  }

  if (expression.body.type === 'BlockStatement') {
    for (const statement of expression.body.body) {
      processNode(statement, id, editor)
    }
  } else {
    const id = getUID()
    editor.add({ group: 'nodes', data: { id, parent, type: 'Return', label: 'return' }})

    const expNode = processExpression(expression.body, id, editor)

    editor.add({ group: 'edges', data: { id: getUID(), source: expNode.id, target: id }})
  }

  return { id }
}

export function process(node: ASTNode, editor: Graph) {
  if (node.type === 'File') {
    for (const statement of node.program.body) {
      processNode(statement, undefined, editor)
    }
  } else {
    throw new Error('process: cannot process ' + node.type)
  }
}
