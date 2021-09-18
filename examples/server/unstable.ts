import { easyhardServer } from 'easyhard-server'
import { UnstableActions } from '../shared'
import { passObservable } from './shared'

export default easyhardServer<UnstableActions>({
  passObservable: passObservable()
})
