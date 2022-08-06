
(global as { __debugScope?: string }).__debugScope = 'server'
import express from 'express'
import expressWs from 'express-ws'
import * as http from 'http'
import basic from './basic'
import cookie from './cookie'
import date from './date'
import observable from './observable'
import reconnect from './reconnect'
import request from './request'
import unstable from './unstable'
import upload from './upload'
import './uws'

const app = express()
expressWs(app)

const router = express.Router()
app.use(router)


router.get('/api', (req, res) => {
  res.send('test')
})

router.post('/api/basic', basic.httpTunnel)
router.ws('/api/basic', basic.attachClient)

router.post('/api/cookie', cookie.httpTunnel)
router.ws('/api/cookie', cookie.attachClient)

router.post('/api/date', date.httpTunnel)
router.ws('/api/date', date.attachClient)

router.post('/api/observable', observable.httpTunnel)
router.ws('/api/observable', observable.attachClient)

router.post('/api/reconnect', reconnect.httpTunnel)
router.ws('/api/reconnect', (ws, req) => {
  reconnect.attachClient(ws, req)
  setTimeout(() => ws.terminate(), 5000)
})

router.post('/api/request', request.httpTunnel)
router.ws('/api/request', request.attachClient)

router.post('/api/unstable', unstable.httpTunnel)
router.ws('/api/unstable', (ws, req) => {
  unstable.attachClient(ws, req)
  setTimeout(() => {
    close()
    ws.terminate()
  }, 5000)
  setTimeout(listen, 7000)
})

router.post('/api/upload', upload.httpTunnel)
router.ws('/api/upload', upload.attachClient)

let listener: http.Server
function close() {
  console.log('close')
  if (listener) listener.close()
}
function listen() {
  console.log('Listening..')
  listener = app.listen(3000, () => {
    console.log('Listen port 3000')
  })
}

listen()
