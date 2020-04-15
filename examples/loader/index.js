const { parse, print, types: { builders: b } } = require('recast')

const ID = '___id';
const HOT = '___hot';
const RENDERER = '___renderer';

module.exports = function(source) {
  const ast = parse(source);
  
  const imports = ast.program.body.filter(item => item.type === 'ImportDeclaration');
  const exportFuncBlocks = ast.program.body.filter(item => item.type === 'ExportNamedDeclaration');
  const hmrFunctions = exportFuncBlocks.filter(item => item.comments && item.comments.some(comment => comment.type === 'Line' && comment.value.match('@hmr')))
  const hmrFunctionNames = hmrFunctions.map(item => item.declaration.id.name);
  console.log(source);
  if (hmrFunctions.length === 0) return source;

  const importApi = b.importDeclaration([
    b.importSpecifier(b.identifier('hot'), b.identifier(HOT)),
    b.importSpecifier(b.identifier('rerender'), b.identifier(RENDERER))
  ], b.stringLiteral('../../loader/api'))

  const idVar = b.variableDeclaration('var', [
    b.variableDeclarator(
      b.identifier(ID),
      b.stringLiteral(this.resourcePath)
    )
  ]);

  ast.program.body.splice(imports.length, 0, idVar);
  ast.program.body.splice(0, 0, importApi);


  hmrFunctions.forEach(item => {
    const funcDeclaration = item.declaration;
    const funcNameIdentifier = funcDeclaration.id;

    item.declaration = b.variableDeclaration('var', [
      b.variableDeclarator(funcNameIdentifier, b.callExpression(
        b.identifier(HOT),
        [
          b.literal(funcNameIdentifier.name),
          b.identifier(ID),
          b.functionExpression(null, funcDeclaration.params, funcDeclaration.body)
        ]
      ))
    ]);
  });

  ast.program.body.push(parse(`if (module.hot) {
    module.hot.accept();
    ${RENDERER}({ ${hmrFunctionNames.join(', ')} }, ${ID});
  }`).program.body[0])

  console.log(print(ast).code)
  return print(ast).code;
}