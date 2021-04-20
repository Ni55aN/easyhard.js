import { easyhardServer } from 'easyhard-server'
import { Actions } from '../shared';
import express from 'express'
import expressWs from 'express-ws'

const app = express()
expressWs(app)

const router = express.Router()
app.use(router)

const server = easyhardServer<Actions>({
  getData(req, res) {
    let i = 0;
    const interval = setInterval(() => res.next({ count: ++i }), 1000)

    setTimeout(() => {
      clearInterval(interval)
      res.complete()
    }, 10000)
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