import { join } from 'path'
import fs from 'fs-extra'
import ts from '@tsd/typescript'
import { process as processRecast } from './transpiler'
import { process as processTS } from './transpiler/typescript'
import { neo4jAdapter, neo4jSimplify, getNodes, clear } from './neo4j-view'
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

async function getRecastAST(filepath: string) {
  const source = await fs.promises.readFile(filepath, { encoding: 'utf-8' })
  const tsAst = parse(source)

  console.log('Source', source)
  console.log('Root', tsAst.program.body)

  return tsAst
}

async function getTypeScriptAST(filepath: string) {
  const program = ts.createProgram({
    rootNames: [filepath],
    options: {}
  })
  const checker = program.getTypeChecker()
  const source = program.getSourceFile(filepath)

  if (!source) throw new Error('source not found')
  return source
}

void async function () {
  await clear(driver)
  const file = join(__dirname, './assets/rx.ts')
  // const tsAst = await getRecastAST(file)
  const tsAst = await getTypeScriptAST(file)


  // const cy = cytoscape()
  // await processRecast(tsAst, cytoscapeAdapter(cy))

  // const data = cy.json() as { elements: ElementsDefinition }
  // graphData.next([...data.elements.nodes, ...data.elements.edges])

  // await processRecast(tsAst, neo4jAdapter(driver))
  const session = driver.session()
  const tr = session.beginTransaction()
  console.time('processTS')
  await processTS(tsAst, neo4jAdapter(tr))
  console.timeEnd('processTS')
  await tr.commit()
  await session.close()
  // await neo4jSimplify(driver)

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
