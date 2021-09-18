import { easyhardServer } from 'easyhard-server'
import { ReconnectActions } from '../shared'
import { getInterval, passObservable } from './shared'

export default easyhardServer<ReconnectActions>({
  getData: getInterval(),
  passObservable: passObservable()
})
