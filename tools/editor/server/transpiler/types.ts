
export type Graph = {
  addNode(data: Record<string, any>): Promise<{ id: string }>
  addEdge(source: string, target: string,  data: Record<string, any>): Promise<{ id: string }>
  findIdentifier(name: string, prop: 'identifier' | 'typeIdentifier', parent: Scope): Promise<null | { id: string }>
  patchData(id: string, data: Record<string, any>): Promise<void>
}
export type Scope = string | undefined
