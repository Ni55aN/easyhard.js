import { join } from 'path'
import ts from '@tsd/typescript'
import { process } from './transpiler/typescript'
import { clear, setProgram } from './neo4j-view'
import neo4j from 'neo4j-driver'
import { easyhardServer } from 'easyhard-server'
import { Actions } from '../shared/bridge'
import { BehaviorSubject, map } from 'rxjs'
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
  const file = join(__dirname, './assets/rx.ts')
  const tsAst = await getTypeScriptAST(file)

  const cy = cytoscape()
  console.time('process')
  await process(tsAst, cytoscapeAdapter(cy))
  console.timeEnd('process')

  const data = cy.json() as { elements: ElementsDefinition }
  graphData.next([...data.elements.nodes, ...data.elements.edges])

  await clear(driver)
  console.time('setProgram')
  await setProgram(driver, [...data.elements.nodes, ...data.elements.edges])
  console.timeEnd('setProgram')
}()
