import { easyhardServer } from 'easyhard-server'
import { interval } from 'rxjs'
import { map, mergeMap } from 'rxjs/operators'
import { DateActions } from '../shared'

export default easyhardServer<DateActions>({
  getDate: mergeMap((params) => {
    return interval(500).pipe(map(() => ({ date: params.date, date2: new Date() })))
  })
})
