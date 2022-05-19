/* eslint-disable @typescript-eslint/no-explicit-any */
import { parse, print, types } from 'recast'
import { namedTypes } from 'ast-types'

const ID = '___id'
const HOT = '___hot'
const RENDERER = '___renderer'

const { builders: b } = types

export default function(this: { resourcePath: string }, source: string): string {
  const ast = parse(source) as namedTypes.File

  const imports = ast.program.body.filter(item => item.type === 'ImportDeclaration')
  const exportBlocks = ast.program.body.filter((item): item is namedTypes.ExportNamedDeclaration => item.type === 'ExportNamedDeclaration')
  const hmrFunctions = exportBlocks
    .filter((item): item is Omit<namedTypes.ExportNamedDeclaration, 'declaration'> & { declaration: namedTypes.FunctionDeclaration } => {
      return item.declaration?.type === 'FunctionDeclaration'
    })
    .filter(item => item.comments && item.comments.some(comment => comment.type === 'Line' && comment.value.match('@hmr')))
  const hmrFunctionNames: string[] = hmrFunctions.map(item => item.declaration.id.name)

  if (hmrFunctions.length === 0) return source

  const importApi = b.importDeclaration([
    b.importSpecifier(b.identifier('hot'), b.identifier(HOT)),
    b.importSpecifier(b.identifier('rerender'), b.identifier(RENDERER))
  ], b.stringLiteral('easyhard-api'))

  const idVar = b.variableDeclaration('var', [
    b.variableDeclarator(
      b.identifier(ID),
      b.stringLiteral(this.resourcePath)
    )
  ])

  ast.program.body.splice(imports.length, 0, idVar)
  ast.program.body.splice(0, 0, importApi)


  hmrFunctions.forEach((item: Omit<namedTypes.ExportNamedDeclaration, 'declaration'> & { declaration: namedTypes.FunctionDeclaration | namedTypes.VariableDeclaration }) => {
    const funcDeclaration = item.declaration
    if (funcDeclaration.type !== 'FunctionDeclaration') return
    const funcNameIdentifier = funcDeclaration?.id

    item.declaration = b.variableDeclaration('var', [
      b.variableDeclarator(funcNameIdentifier, b.callExpression(
        b.identifier(HOT),
        [
          b.literal(funcNameIdentifier.name),
          b.identifier(ID),
          b.functionExpression(null, funcDeclaration.params, funcDeclaration.body)
        ]
      ))
    ])
  })

  ast.program.body.push((parse(`if (module.hot) {
    module.hot.accept();
    ${RENDERER}({ ${hmrFunctionNames.join(', ')} }, ${ID});
  }`) as namedTypes.File).program.body[0])

  return print(ast).code
}
