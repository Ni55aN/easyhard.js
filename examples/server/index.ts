import { easyhardServer } from 'easyhard-server'
import { Actions } from '../shared';
import express from 'express'
import expressWs from 'express-ws'
import { interval } from 'rxjs'
import { first, map, take } from 'rxjs/operators';

const app = express()
expressWs(app)

const router = express.Router()
app.use(router)

const server = easyhardServer<Actions>({
  getData(payload) {
    return interval(1000).pipe(
      take(10),
      map(count => ({ count }))
    )
  }
})

router.get('/api', (req, res) => {
  res.send('test')
})

router.ws('/api', connection => {
  server.attachClient(connection)
})

app.listen(3000, () => {
  console.log('Listen port 3000')
})