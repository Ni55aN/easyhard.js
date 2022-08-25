import { join } from 'path'
import express from 'express'
import expressWs from 'express-ws'
import neo4j from 'neo4j-driver'
import { easyhardServer } from 'easyhard-server'
import { catchError, mergeMap, OperatorFunction, pipe, throwError } from 'rxjs'
import cytoscape, { ElementsDefinition } from 'cytoscape'
import { Actions } from '../shared/bridge'
import { clear, setProgram } from './neo4j-view'
import { cytoscapeAdapter } from './cy-view/adapter'
import { Transpiler } from './transpiler'

const driver = neo4j.driver(
  'neo4j://localhost',
  neo4j.auth.basic('neo4j', 'test') // TODO envs
)

const server = easyhardServer<Actions>({
  openFile: debugError(mergeMap(openFile))
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


function debugError<T,R>(op: OperatorFunction<T, R>) {
  return pipe(op, catchError(e => {
    console.error(e)
    return throwError(new Error('unhandled exception'))
  }))
}

async function openFile({ path }: { path: string }) {
  const file = join(__dirname, path)
  const transpiler = new Transpiler(file)

  const cy = cytoscape()
  console.time('process ' + path)
  await transpiler.process(cytoscapeAdapter(cy))
  console.timeEnd('process ' + path)

  const data = cy.json() as { elements: ElementsDefinition }

  const elements = [...(data.elements.nodes || []), ...(data.elements.edges || [])]

  await clear(driver, path)
  console.time('setProgram ' + path)
  await setProgram(driver, path, elements)
  console.timeEnd('setProgram ' + path)

  return {
    data: elements
  }
}
