
export type Graph = {
  addNode(data: Record<string, any>): Promise<{ id: string }>
  addEdge(source: string, target: string,  data: Record<string, any>): Promise<{ id: string }>
  findIdentifier(name: string, prop: 'identifiers' | 'typeIdentifiers', parent: Scope): Promise<null | { id: string }>
  getData(id: string): Promise<Record<string, any>>
  patchData(id: string, data: Record<string, any>): Promise<void>
}
export type Scope = string | undefined
