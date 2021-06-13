
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
router.ws('/api/basic', basic.attachClient as any)

app.listen(3000, () => {
  console.log('Listen port 3000')
})
