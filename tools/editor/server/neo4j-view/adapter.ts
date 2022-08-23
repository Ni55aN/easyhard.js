import { Driver } from 'neo4j-driver'
import { Graph } from '../transpiler'

export function neo4jAdapter(driver: Driver): Graph {
  return {
    async addNode(data) {
      const session = driver.session()
      const result = await session.run(`
        create (n:${data.type} { ${Object.keys(data).filter(key => data[key] !== undefined).map(key => `${key}: $${key}`).join(', ')} })
        ${data.parent ? `
        with n
        match (p) where id(p) = $parent
        create (n)-[:Parent]->(p)
        ` : ''}
        return n
      `, data)
      await session.close()

      const singleRecord = result.records[0]
      const node = singleRecord.get(0)

      return { id: node.identity.toNumber() }
    },
    async addEdge(source, target, data) {
      const session = driver.session()
      const result = await session.run(`
        match (a) where id(a) = $source
        match (b) where id(b) = $target
        create (a)-[n:EDGE { label: $label }]->(b) return n
      `, { label: data.label || '', source, target })
      await session.close()

      const singleRecord = result.records[0]
      const node = singleRecord.get(0)

      return { id: node.identity.toNumber() }
    },
    async findIdentifier(name, prop, parent) {
      const session = driver.session()
      const result = await session.run(parent ? `
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
      await session.close()

      if (!result.records.length) throw new Error('cannot find identifier "' + name + '" in scope ' + parent)

      const singleRecord = result.records[0]
      const node = singleRecord.get(0)

      return { id: node.identity.toNumber() }
    },
    async patchData(id, data) {
      const session = driver.session()
      await session.run(`
        match (n) where id(n) = $id
        ${Object.keys(data).map(key => `SET n.${key} = $${key}`).join('\n')}
      `, { id, ...data })
      await session.close()
    }
  }
}
