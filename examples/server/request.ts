import { easyhardServer } from 'easyhard-server'
import { map } from 'rxjs/operators'
import { RequestActions } from '../shared'

export default easyhardServer<RequestActions>({
  requestData: map(params => {
    return { ip: params.$request.socket.remoteAddress || '' }
  })
})
