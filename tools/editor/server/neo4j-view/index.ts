import { ElementDefinition, ElementsDefinition } from 'cytoscape'
import { Driver, Node, Relationship } from 'neo4j-driver'

export * from './simplifier'

export async function clear(driver: Driver) {
  const session = driver.session()

  await session.run(`
    match (n) detach delete n
  `)

  session.close()
}

export async function setProgram(driver: Driver, list: ElementDefinition[]) {
  const session = driver.session()

  await session.run(`
    unwind $list as item
    call {
      with item
      with item as nodeProps where nodeProps.group = 'nodes'
      create (n)
      set n = nodeProps.data
      with n, nodeProps
      CALL apoc.create.setLabels(n, [nodeProps.data.type])
      YIELD node
      return node as element
      union
      with item
      with item as edgeProps where edgeProps.group = 'edges'
      match (source { id: edgeProps.data.source })
      match (target { id: edgeProps.data.target })
      create (source)-[r:Edge]->(target)
      set r = edgeProps.data
      return r as element
      union
      with item
      with item as parentProps where parentProps.group = 'nodes' and parentProps.data.parent is not null
      match (node { id: parentProps.data.id })
      match (parent { id: parentProps.data.parent })
      create (node)-[r:Parent]->(parent)
      return r as element
    }
    return element
  `, { list })

  session.close()
}

export async function getNodes(driver: Driver): Promise<(Node | Relationship)[]> {
  const session = driver.session()

  const result = await session.run(`
    match (n)
    with collect(n) as nodes
    optional match ()-[r]-()
    where not r:Parent
    with nodes, collect(r) as rels
    unwind nodes + rels as element
    return DISTINCT element
  `)

  session.close()

  return result.records.map(record => {
    return record.toObject().element
  })
}
