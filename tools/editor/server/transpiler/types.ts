
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
export type ObjectTypeType = 'ObjectType'
export type ConditionalType = 'Conditional'
export type TypeType = 'Type'
export type GenericCallType = 'GenericCall'
export type UnionType = 'UnionType'
export type IntersectionType = 'IntersectionType'
export type FuncType = 'FuncType'
export type KeywordTypeType = `${KeywordType}Type`

export type NodeType = CallType | LiteralType | ObjectType | ObjectTypeType | FuncType
  | MemberType | ConditionalType | BinaryOperatorType | FunctionDeclarationType
  | ParameterDeclarationType | ReturnType | ImportDeclarationType | VariableDeclarationType
  | TypeType | UnionType | IntersectionType | KeywordTypeType | GenericCallType

export type Value = string | number | boolean | null

type NodeCommon = {
  label: string
  parent?: Scope
  typingKind: string | null
  typingText: string
}

type VariableDeclarationNode = NodeCommon & {
  type: VariableDeclarationType
  identifiers: string[]
  value: Value
}
type CallNode = NodeCommon & {
  type: CallType
}

type MemberNode = NodeCommon & {
  type: MemberType
  property: string
}
type ObjectNode = NodeCommon & {
  type: ObjectType
}
type LiteralNode = NodeCommon & {
  type: LiteralType
  value: Value
}
type BinaryNode = NodeCommon & {
  type: BinaryOperatorType
  op: string
}
type ConditionalNode = NodeCommon & {
  type: ConditionalType
}
type FunctionDeclarationNode = NodeCommon & {
  type: FunctionDeclarationType
  identifiers: string[]
}
type ReturnNode = NodeCommon & {
  type: ReturnType
}
type ParameterDeclarationNode = NodeCommon & {
  type: ParameterDeclarationType
  name: string
  identifiers: string[]
}
type ImportDeclarationNode = NodeCommon & {
  type: ImportDeclarationType
  module: string
  source?: string
  identifiers: string[]
  typeIdentifiers: string[]
}
export type NodePayload = VariableDeclarationNode
  | CallNode
  | MemberNode
  | ObjectNode
  | LiteralNode
  | BinaryNode
  | ConditionalNode
  | FunctionDeclarationNode
  | ReturnNode
  | ParameterDeclarationNode
  | ImportDeclarationNode

export type NodeData = { id: string } & NodePayload

type GeneralTypeNode = NodeCommon & {
  type: KeywordTypeType | IntersectionType | UnionType | ObjectTypeType | GenericCallType | FuncType | '?'
}
type TypeNode = {
  type: TypeType
  typeIdentifiers: string[]
}

export type TypeNodePayload = ImportDeclarationNode
  | GeneralTypeNode
  | TypeNode

export type TypeNodeData = { id: string } & TypeNodePayload

export type Graph = {
  addNode<T extends NodePayload | TypeNodePayload>(data: T): Promise<{ id: string }>
  addEdge(source: string, target: string,  data: Record<string, any>): Promise<{ id: string }>
  findIdentifier(name: string, prop: 'identifiers' | 'typeIdentifiers', parent: Scope): Promise<null | { id: string }>
  getData(id: string): Promise<Record<string, any>>
  patchData(id: string, data: Record<string, any>): Promise<void>
}
export type ReadonlyGraph = {
  getData(id: string): Promise<Record<string, any>>
}

export type Scope = string | undefined
