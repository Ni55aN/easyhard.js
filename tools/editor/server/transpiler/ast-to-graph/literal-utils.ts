import ts from 'typescript'

export function isLiteral(arg: ts.Expression): arg is ts.LiteralExpression {
  return ts.isStringLiteral(arg)
    || ts.isNumericLiteral(arg)
    || arg.kind === ts.SyntaxKind.TrueKeyword
    || arg.kind === ts.SyntaxKind.FalseKeyword
    || arg.kind === ts.SyntaxKind.NullKeyword
}

export function getLiteralValue(arg: ts.LiteralExpression) {
  switch(arg.kind) {
    case ts.SyntaxKind.TrueKeyword: return true
    case ts.SyntaxKind.FalseKeyword: return false
    case ts.SyntaxKind.NullKeyword: return null
    case ts.SyntaxKind.NumericLiteral: return +arg.text
    default: return arg.text
  }
}
