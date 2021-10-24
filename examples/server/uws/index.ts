import uWS from 'uWebSockets.js'
import basic from './basic'
import upload from './upload'
import unstable from './unstable'

const app = uWS.App()

app.ws('/uws/basic/', basic.attachClient({ open() { 111 }}))
app.any('/uws/basic/', basic.httpTunnel)

app.ws('/uws/upload/', upload.attachClient({ open() { 111 }}))
app.any('/uws/upload/', upload.httpTunnel)

app.ws('/uws/unstable/', unstable.attachClient({ open(ws) {
  setTimeout(() => {
    ws.close()
    close()
  }, 5000)
  setTimeout(() => {
    listen()
  }, 7000)
}}))
app.any('/uws/unstable/', unstable.httpTunnel)

const port = 9001
let listenToken: null | string = null

function close() {
  console.log('close')
  if (listenToken) {
    uWS.us_listen_socket_close(listenToken)
  }
}

function listen() {
  console.log('Listening..')
  app.listen(port, (token) => {
    if (token) {
      listenToken = token
      console.log(`Listening to port ${port}`)
    } else {
      console.log(`Failed to listen to port ${port}`)
    }
  })
}

listen()
