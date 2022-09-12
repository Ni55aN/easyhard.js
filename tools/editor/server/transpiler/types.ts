
export type KeywordType = 'Number' | 'String' | 'Boolean' | 'Null'
export type NodeType = 'Call' | 'Literal' | 'Object' | 'ObjectType' | 'FuncType'
  | 'Member' | 'Conditional' | 'BinaryOperator' | 'FunctionDeclaration'
  | 'ParameterDeclaration' | 'Return' | 'ImportDeclaration' | 'VariableDeclaration'
  | 'Return' | 'Type' | 'UnionType' | 'IntersectionType' | `${KeywordType}Type` | '?'

export type Graph = {
  addNode(data: Record<string, any> & { type: NodeType }): Promise<{ id: string }>
  addEdge(source: string, target: string,  data: Record<string, any>): Promise<{ id: string }>
  findIdentifier(name: string, prop: 'identifiers' | 'typeIdentifiers', parent: Scope): Promise<null | { id: string }>
  getData(id: string): Promise<Record<string, any>>
  patchData(id: string, data: Record<string, any>): Promise<void>
}
export type Scope = string | undefined
