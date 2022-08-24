import { join } from 'path'
import fs from 'fs-extra'
import { process } from './transpiler'
import { neo4jAdapter, getNodes, clear } from './neo4j-view'
import neo4j, { Node } from 'neo4j-driver'
import { parse } from 'recast/parsers/typescript'
import { easyhardServer } from 'easyhard-server'
import { Actions } from '../shared/bridge'
import { BehaviorSubject, map, mergeMap, of } from 'rxjs'
import express from 'express'
import expressWs from 'express-ws'
import cytoscape, { ElementDefinition, ElementsDefinition } from 'cytoscape'
import { cytoscapeAdapter } from './cy-view/adapter'

const driver = neo4j.driver(
  'neo4j://localhost',
  neo4j.auth.basic('neo4j', 'test') // TODO envs
)

const graphData = new BehaviorSubject<ElementDefinition[]>([])

const server = easyhardServer<Actions>({
  getData: graphData.pipe(map(data => ({ data })))
})

const app = express()
expressWs(app)

const router = express.Router()
app.use(router)

router.get('/api', (req, res) => {
  res.send('test')
})

router.post('/api', server.httpTunnel)
router.ws('/api', server.attachClient)

app.listen(3000, () => {
  console.log('Listen port 3000')
})

void async function () {
  const source = await fs.promises.readFile(join(__dirname, './assets/rx.ts'), { encoding: 'utf-8' })
  const tsAst = parse(source)

  console.log('Source', source)
  console.log('Root', tsAst.program.body)

  // const cy = cytoscape()
  // await process(tsAst, cytoscapeAdapter(cy))

  // const data = cy.json() as { elements: ElementsDefinition }
  // graphData.next([...data.elements.nodes, ...data.elements.edges])

  await clear(driver)
  await process(tsAst, neo4jAdapter(driver))

  const data = await getNodes(driver)

  graphData.next(data.map(v => {
    if (v instanceof Node) {
      return { group: 'nodes' as const, data: {
        id: v.identity.toString(),
        labels: v.labels,
        ...v.properties
      }}
    }
    return {
      group: 'edges' as const,
      data: {
        id: `edge_${v.identity.toString()}`,
        ...v.properties,
        type: v.type,
        source: v.start.toString(),
        target: v.end.toString()
      }
    }
  }))
}()

