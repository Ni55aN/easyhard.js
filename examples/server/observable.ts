import { easyhardServer} from 'easyhard-server'
import { ObservableActions } from '../shared'
import { passObservable } from './shared'

export default easyhardServer<ObservableActions>({
  passObservable: passObservable()
})
