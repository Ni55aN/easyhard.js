
import express from 'express'
import expressWs from 'express-ws'
import basic from './basic'

const app = express()
expressWs(app)

const router = express.Router()
app.use(router)


router.get('/api', (req, res) => {
  res.send('test')
})

router.post('/api/basic', basic.httpTunnel)
router.ws('/api/basic', ws => {
  basic.attachClient(ws)
})

router.post('/api/basic/v2', basic.httpTunnel)
router.ws('/api/basic/v2', ws => {
  basic.attachClient(ws)
  setTimeout(() => ws.terminate(), 5000)
})

app.listen(3000, () => {
  console.log('Listen port 3000')
})
