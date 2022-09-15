
export type KeywordType = 'Number' | 'String' | 'Boolean' | 'Null'
export type CallType = 'Call'
export type LiteralType = 'Literal'
export type MemberType = 'Member'
export type BinaryOperatorType = 'BinaryOperator'
export type VariableDeclarationType = 'VariableDeclaration'
export type ImportDeclarationType = 'ImportDeclaration'
export type FunctionDeclarationType = 'FunctionDeclaration'
export type ParameterDeclarationType = 'ParameterDeclaration'
export type ReturnType = 'Return'
export type ObjectType = 'Object'
export type ConditionalType = 'Conditional'
export type NodeType = CallType | LiteralType | ObjectType | 'ObjectType' | 'FuncType'
  | MemberType | ConditionalType | BinaryOperatorType | FunctionDeclarationType
  | ParameterDeclarationType | 'Return' | ImportDeclarationType | VariableDeclarationType
  | 'Return' | 'Type' | 'UnionType' | 'IntersectionType' | `${KeywordType}Type` | 'GenericCall' | '?'

export type Graph = {
  addNode(data: Record<string, any> & { type: NodeType }): Promise<{ id: string }>
  addEdge(source: string, target: string,  data: Record<string, any>): Promise<{ id: string }>
  findIdentifier(name: string, prop: 'identifiers' | 'typeIdentifiers', parent: Scope): Promise<null | { id: string }>
  getData(id: string): Promise<Record<string, any>>
  patchData(id: string, data: Record<string, any>): Promise<void>
}
export type ReadonlyGraph = {
  getData(id: string): Promise<Record<string, any>>
}

export type Scope = string | undefined
