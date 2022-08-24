import { Session, Transaction } from 'neo4j-driver'
import { Graph } from '../transpiler/types'

export function neo4jAdapter(transaction: Transaction): Graph {
  return {
    async addNode(data) {
      const result = await transaction.run(`
        create (n:${data.type} { ${Object.keys(data).filter(key => data[key] !== undefined).map(key => `${key}: $${key}`).join(', ')} })
        ${data.parent ? `
        with n
        match (p) where id(p) = $parent
        create (n)-[:Parent]->(p)
        ` : ''}
        return n
      `, data)

      const singleRecord = result.records[0]
      const node = singleRecord.get(0)

      return { id: node.identity.toNumber() }
    },
    async addEdge(source, target, data) {
      const result = await transaction.run(`
        match (a) where id(a) = $source
        match (b) where id(b) = $target
        create (a)-[n:EDGE { label: $label }]->(b) return n
      `, { label: data.label || '', source, target })

      const singleRecord = result.records[0]
      const node = singleRecord.get(0)

      return { id: node.identity.toNumber() }
    },
    async findIdentifier(name, prop, parent) {
      const result = await transaction.run(parent ? `
        match (p:FunctionDeclaration) where id(p) = $parent
        call {
            with p
            match (n)-[:Parent]->(p) where n.${prop} = $name
            return n
            union
            with p
            match (n)-[:Parent]->(:FunctionDeclaration)<-[pp:Parent*1..]-(p) where n.${prop} = $name
            with n, size(pp) as s order by s asc
            return n
            union
            with p
            match (n) where n.${prop} = $name and not (n)-[:Parent]->()
            return n
        }
        with collect(distinct n) as nodes
        return nodes[0]
      ` : `
        match (n { ${prop}: $name })
        return n
      `, { name, parent })

      if (!result.records.length) throw new Error('cannot find identifier "' + name + '" in scope ' + parent)

      const singleRecord = result.records[0]
      const node = singleRecord.get(0)

      return { id: node.identity.toNumber() }
    },
    async patchData(id, data) {
      await transaction.run(`
        match (n) where id(n) = $id
        ${Object.keys(data).map(key => `SET n.${key} = $${key}`).join('\n')}
      `, { id, ...data })
    }
  }
}
