import uWS from 'uWebSockets.js'
import basic from './basic'

const app = uWS.App()

app.ws('/uws/basic/', basic.attachClient({ open() {}}))
app.any('/uws/basic/', basic.httpTunnel)

const port = 9001;

app.listen(port, (token) => {
  if (token) {
    console.log('Listening to port ' + port);
  } else {
    console.log('Failed to listen to port ' + port);
  }
});
