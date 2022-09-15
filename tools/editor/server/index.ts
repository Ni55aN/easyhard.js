import { join } from 'path'
import express from 'express'
import expressWs from 'express-ws'
import neo4j from 'neo4j-driver'
import { easyhardServer } from 'easyhard-server'
import { catchError, mergeMap, OperatorFunction, pipe, throwError } from 'rxjs'
import cytoscape, { Core, ElementDefinition } from 'cytoscape'
import { Actions } from '../shared/bridge'
import { clear, setProgram } from './neo4j-view'
import { cytoscapeReader, cytoscapeWriter } from './cy-view/adapter'
import { Transpiler } from './transpiler'
import { Simplifier } from './simplifier'
import {
  RxTransformer,
  EasyhardTransformer,
  CallTransformer,
  ImportMemberTransformer,
  ArgumentsTransformer
} from './simplifier/transformers'

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

function exportGraph(cy: Core) {
  const data = cy.json(true as any) as any as { elements: ElementDefinition[] }

  return data
}

async function openFile({ path }: { path: string }) {
  const file = join(__dirname, path)
  const transpiler = new Transpiler(file)

  const cy = cytoscape()
  console.time('process ' + path)
  await transpiler.toGraph(cytoscapeWriter(cy))
  console.timeEnd('process ' + path)

  await clear(driver, path)
  console.time('setProgram ' + path)
  await setProgram(driver, path, exportGraph(cy).elements)
  console.timeEnd('setProgram ' + path)

  const simplifier = new Simplifier([
    new RxTransformer,
    new EasyhardTransformer,
    new CallTransformer,
    new ImportMemberTransformer,
    new ArgumentsTransformer
  ])

  simplifier.forward(cy)
  simplifier.backward(cy)
  await transpiler.fromGraph(cy)

  return {
    data: exportGraph(cy).elements
  }
}
