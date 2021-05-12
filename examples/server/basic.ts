import { easyhardServer } from 'easyhard-server'
import { Actions } from '../shared'
import { interval, throwError } from 'rxjs'
import { concatMap, map, take } from 'rxjs/operators'

export default easyhardServer<Actions>({
  getData() {
    return interval(1000).pipe(
      take(10),
      map(count => ({ count }))
    )
  },
  getDataWithParams(payload) {
    return interval(500).pipe(
      take(14),
      map(count => ({ count: String(count) + '|' + String(payload?.num) }))
    )
  },
  getDataError() {
    return interval(1000).pipe(
      take(10),
      concatMap(n => {
        return n > 3 ? throwError(new Error('more then 3')) : Promise.resolve(n)
      }),
      map(count => ({ count }))
    )
  }
})
