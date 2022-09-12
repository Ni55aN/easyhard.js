import ts, { BinaryOperator, SyntaxKind } from 'typescript'

export const operatorTokenMap: {[kind in SyntaxKind]?: string} = {
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

export function tokenToString(operatorToken: ts.BinaryOperatorToken) {
  return operatorTokenMap[operatorToken.kind]
}

export function stringToToken(token: string): BinaryOperator | undefined {
  const item = Object.entries(operatorTokenMap).find(([_, str]) => str === token)

  if (item) {
    return +item[0]
  }
}
