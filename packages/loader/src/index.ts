/* eslint-disable @typescript-eslint/no-explicit-any */
import { parse, print, types } from 'recast'

const ID = '___id'
const HOT = '___hot'
const RENDERER = '___renderer'

const { builders: b } = types

export default function(this: { resourcePath: string }, source: string): string {
  const ast = parse(source)
  
  const imports = ast.program.body.filter((item: any) => item.type === 'ImportDeclaration')
  const exportFuncBlocks = ast.program.body.filter((item: any) => item.type === 'ExportNamedDeclaration')
  const hmrFunctions = exportFuncBlocks.filter((item: any) => item.comments && item.comments.some((comment: any) => comment.type === 'Line' && comment.value.match('@hmr')))
  const hmrFunctionNames: string[] = hmrFunctions.map((item: any) => item.declaration.id.name)

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


  hmrFunctions.forEach((item: any) => {
    const funcDeclaration = item.declaration
    const funcNameIdentifier = funcDeclaration.id

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

  ast.program.body.push(parse(`if (module.hot) {
    module.hot.accept();
    ${RENDERER}({ ${hmrFunctionNames.join(', ')} }, ${ID});
  }`).program.body[0])

  return print(ast).code
}