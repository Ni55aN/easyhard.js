import { $ } from 'easyhard'
import {
  Node as ASTNode, Statement, Expression, ObjectExpression, ObjectProperty, BinaryExpression,
  CallExpression, MemberExpression, SpreadElement, JSXNamespacedName, ArgumentPlaceholder,
  Identifier, ConditionalExpression, FunctionDeclaration, ArrowFunctionExpression,
  FunctionExpression
} from '@babel/types'
import { Editor } from '../types'
import { arrangeSubnodes, NestedNode, Node } from '../view'

type Scope = Node | null | undefined

function getValue(exp: Expression | SpreadElement | JSXNamespacedName | ArgumentPlaceholder) {
  const literal = ['StringLiteral', 'NumericLiteral', 'BooleanLiteral']

  if (!literal.includes(exp.type)) return
  return 'value' in exp ? exp.value : null
}

async function processObject(exp: ObjectExpression, editor: Editor, props: any) {
  const properties = exp.properties
    .filter((p): p is ObjectProperty => p.type === 'ObjectProperty' && p.key.type === 'Identifier')

  const objectNode = await editor.addNode(editor.components.Object, [4, 100], { properties: properties.map(p => (p.key as Identifier).name).join(', ') })
  props.nodeCreated && props.nodeCreated(objectNode)
  for (const p of properties) {
    const value =  p.value
    const key =  p.key as Identifier
    if (value.type === 'Identifier') {
      const identNode = await processExpression(value, objectNode.belongsTo, editor, props)

      if (identNode instanceof Node) {
        const objInput = objectNode.inputs.get(key.name)
        const identOutput = identNode.outputs.get('return')
        editor.connect(identOutput as any, objInput as any)
      }
    }

  }

  return objectNode
}

async function processMember(expression: MemberExpression, editor: Editor, props: ProcessProps) {
  const object = expression.object
  const property = expression.property

  if (property.type === 'Identifier') {
    const memberNode = await editor.addNode(editor.components.Member, [4, 100], { property: property.name })
    props.nodeCreated && props.nodeCreated(memberNode)
    const identNode = await processExpression(object, memberNode.belongsTo, editor, props)

    if (!(identNode instanceof Node)) throw new Error('cannot find identNode')

    const identOutput = identNode.outputs.get('return') as any
    const memberInput = memberNode.inputs.get('object') as any

    editor.connect(identOutput, memberInput)
    return memberNode
  } else {
    throw new Error('processMember: cannot process object ' + object.type + ' and property ' + property.type)
  }
}

function isLiteral(arg: Expression) {
  return arg.type === 'StringLiteral' || arg.type === 'NumericLiteral' ||  arg.type === 'BooleanLiteral'
}

async function processCall(expression: CallExpression, scope: Scope, editor: Editor, props: ProcessProps): Promise<Node | undefined> {
  const args = await Promise.all(expression.arguments.map(async arg => {
    if (arg.type === 'SpreadElement' || arg.type === 'JSXNamespacedName' || arg.type === 'ArgumentPlaceholder') return null
    if (isLiteral(arg)) return getValue(arg)

    return await processExpression(arg, scope, editor, props)
  }))
  const callNode = await editor.addNode(editor.components.Call, [0,0], { arguments: args.map(arg => arg instanceof Node ? '' : arg) })
  props.nodeCreated && props.nodeCreated(callNode)
  args.forEach((arg, i) => {
    if (arg instanceof Node) {
      const inputArg = callNode.inputs.get('arg'+i)
      const outputIdent = arg.outputs.get('return')

      editor.connect(outputIdent as any, inputArg as any)
    }
  })

  if (expression.callee.type !== 'V8IntrinsicIdentifier') {
    const calleNode = await processExpression(expression.callee, scope, editor, props)

    if (!(calleNode instanceof Node)) throw new Error('cannot process CallExpression\'s callee')

    const memberOutput = calleNode.outputs.get('return') as any
    const funcInput = callNode.inputs.get('function') as any

    editor.connect(memberOutput, funcInput)
  } else {
    throw new Error('cannot process CallExpression\'s callee')
  }

  return callNode
}

async function processBinary(statement: BinaryExpression, editor: Editor, props: ProcessProps) {
  const { left, right } = statement
  const node = await editor.addNode(editor.components.BinaryOperator, [100,0], {
    op: statement.operator,
    left: $(''),
    right: $('')
  })
  props.nodeCreated && props.nodeCreated(node)

  if (left.type !== 'PrivateName') {
    const identExp = await processExpression(left, node.belongsTo, editor, props)

    if (identExp instanceof Node) {
      const output = identExp.outputs.get('return')
      const input = node.inputs.get('left')

      editor.connect(output as any, input as any)
    } else {
      (node.data.left as $<any>).next(identExp)
    }
  }
  const rightExp = await processExpression(right, node.belongsTo, editor, props)

  if (rightExp instanceof Node) {
    const output = rightExp.outputs.get('return')
    const input = node.inputs.get('right')

    editor.connect(output as any, input as any)
  } else {
    (node.data.right as $<any>).next(rightExp)
  }

  return node
}

async function processConditional(expression: ConditionalExpression, editor: Editor, props: ProcessProps) {
  const node = await editor.addNode(editor.components.Conditional, [100,0], { consequent: $(''), alternate: $('') })
  props.nodeCreated && props.nodeCreated(node)
  const testNode = await processExpression(expression.test, node.belongsTo, editor, props)

  if (testNode instanceof Node) {
    const output = testNode.outputs.get('return')
    const input = node.inputs.get('test')

    editor.connect(output as any, input as any)
  }

  const consequentExp = await processExpression(expression.consequent, node.belongsTo, editor, props)

  if (consequentExp instanceof Node) {
    const output = consequentExp.outputs.get('return')
    const input = node.inputs.get('consequent')

    editor.connect(output as any, input as any)
  } else {
    (node.data.consequent as $<any>).next(consequentExp)
  }

  const alternateExp = await processExpression(expression.alternate, node.belongsTo, editor, props)

  if (alternateExp instanceof Node) {
    const output = alternateExp.outputs.get('return')
    const input = node.inputs.get('alternate')

    editor.connect(output as any, input as any)
  } else {
    (node.data.alternate as $<any>).next(alternateExp)
  }

  return node
}

async function processExpression(expression: Expression, scope: Scope, editor: Editor, props: ProcessProps) {
  if (expression.type === 'CallExpression') {
    return await processCall(expression, scope, editor, props)
  }
  if (expression.type === 'MemberExpression') {
    return await processMember(expression, editor, props)
  }
  if (expression.type === 'BinaryExpression') {
    return await processBinary(expression, editor, props)
  }
  if (expression.type === 'ConditionalExpression') {
    return await processConditional(expression, editor, props)
  }
  if (expression.type === 'Identifier') {
    const matchName = (n: Node) => n.meta.identifier === expression.name
    const scopeNodes = editor.origin.nodes.filter((n: NestedNode) => scope ? n.belongsTo === scope : false)
    const rootNodes = editor.origin.nodes
    const node = scopeNodes.find(matchName) || rootNodes.find(matchName)

    if (!node) throw new Error(`cannot find Identifier "${expression.name}"`)
    return node
  }
  if (expression.type === 'ArrowFunctionExpression') {
    return await processFunction(expression, editor, props)
  } else if (expression.type === 'FunctionExpression') {
    return await processFunction(expression, editor, props)
  }
  if (expression.type === 'ObjectExpression') {
    return await processObject(expression, editor, props)
  }
  if (isLiteral(expression)) {
    return getValue(expression)
  }
  throw new Error('processExpression: cannot process ' + expression.type)
}

type ProcessProps = { nodeCreated?: (node: NestedNode) => void }

async function processNode(statement: Statement | Expression, scope: Scope, editor: Editor, props: ProcessProps) {
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
      const node = await editor.addNode(editor.components.ImportDeclaration, [-100,0], { module, source: specifier?.source })
      props.nodeCreated && props.nodeCreated(node)
      node.meta.identifier = specifier?.local
    }
  } else if (statement.type === 'VariableDeclaration') {
    for (const declarator of statement.declarations) {
      if (declarator.id.type !== 'Identifier') throw new Error('VariableDeclaration: id should be Identifier')
      if (!declarator.init) {
        console.info('Skipped VariableDeclaration without "init"')
        continue
      }
      const id = declarator.id.name

      if (isLiteral(declarator.init)) {
        const value = getValue(declarator.init)
        const node = await editor.addNode(editor.components.VariableDeclaration, [0,0], { value })
        props.nodeCreated && props.nodeCreated(node)
        node.meta.identifier = id
      } else {
        const expNode = await processExpression(declarator.init, scope, editor, props)

        if (!(expNode instanceof Node)) throw new Error('VariableDeclaration: cannot find init\'s node')

        expNode.meta.identifier = id
      }
    }
  } else if (statement.type === 'ExpressionStatement') {
    await processExpression(statement.expression, scope, editor, props)
  } else if (statement.type === 'ReturnStatement') {
    const node = await editor.addNode(editor.components.Return, [280, 200], {})
    props.nodeCreated && props.nodeCreated(node)
    const expNode = statement.argument && await processExpression(statement.argument, node.belongsTo, editor, props)

    if (expNode instanceof Node) {
      const outputReturn = expNode.outputs.get('return')
      const inputArgument = node.inputs.get('argument')

      editor.connect(outputReturn as any, inputArgument as any)
    }
  } else if (statement.type === 'FunctionDeclaration') {
    await processFunction(statement, editor, props)
  } else if (statement.type === 'BlockStatement') {
    for (const item of statement.body) {
      await processNode(item, null, editor, props)
    }
  } else {
    throw new Error('processNode: cannot process statement ' + statement.type)
  }
}

async function processFunction(expression: FunctionDeclaration | ArrowFunctionExpression | FunctionExpression, editor: Editor, props: ProcessProps) {
  const node = await editor.addNode(editor.components.FunctionDeclaration, [280, 200], {})
  props.nodeCreated && props.nodeCreated(node)

  if (expression.type === 'FunctionDeclaration') {
    node.meta.identifier = expression.id?.name
  }

  const subnodes: NestedNode[] = []
  const subprops = {
    nodeCreated: (nestedNode: NestedNode) => {
      subnodes.push(nestedNode)
      nestedNode.belongsTo = node
    }
  }

  for (const statement of expression.params) {
    if (statement.type !== 'Identifier') throw new Error('FunctionDeclaration: cannot process ' + statement.type)
    const { name } = statement
    const node = await editor.addNode(editor.components.ParameterDeclaration, [0,0], { name })

    subprops.nodeCreated && subprops.nodeCreated(node)
    node.meta.identifier = name
  }

  if (expression.body.type === 'BlockStatement') {
    for (const statement of expression.body.body) {
      await processNode(statement, null, editor, subprops)
    }
  } else {
    const returnNode = await editor.addNode(editor.components.Return, [280, 200], {})
    subprops.nodeCreated && subprops.nodeCreated(returnNode)

    const expNode = await processExpression(expression.body, returnNode.belongsTo, editor, subprops)

    if (expNode instanceof Node) {
      const outputReturn = expNode.outputs.get('return')
      const inputArgument = returnNode.inputs.get('argument')

      editor.connect(outputReturn as any, inputArgument as any)
    }
  }

  arrangeSubnodes(node, editor, subnodes)

  return node
}

export async function process(node: ASTNode, editor: Editor, props: ProcessProps) {
  console.log('process', node)
  if (node.type === 'File') {
    for (const statement of node.program.body) {
      await processNode(statement, null, editor, props)
    }
  } else {
    throw new Error('process: cannot process ' + node.type)
  }
}
