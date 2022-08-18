import { Driver, Node, Relationship } from 'neo4j-driver'

export * from './adapter'

export async function clear(driver: Driver) {
  const session = driver.session()

  await session.run(`
    match (n) detach delete n
  `)

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
