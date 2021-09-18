import { $$ } from 'easyhard-common'
import { easyhardServer } from 'easyhard-server'
import { defer, interval, throwError } from 'rxjs'
import { concatMap, map, mergeMap, take } from 'rxjs/operators'
import { BasicActions } from '../shared'
import { getInterval } from './shared'

export default easyhardServer<BasicActions>({
  getData: getInterval(),
  getArray: defer(() => {
    const array = $$([1, 2, 3])

    setTimeout(() => array.insert(4), 3000)
    setTimeout(() => array.remove(2), 4000)
    return array
  }),
  getDataWithParams: mergeMap((payload) => {
    return interval(500).pipe(
      take(14),
      map(count => ({ count: String(count) + '|' + String(payload.num) }))
    )
  }),
  getDataError: interval(1000).pipe(
    take(10),
    concatMap(n => {
      return n > 3 ? throwError(new Error('more then 3')) : Promise.resolve(n)
    }),
    map(count => ({ count }))
  ),
  emptyResponse: map(() => {
    // console.log(params)
  }),
  emptyResponse2: mergeMap(async () => {
    await Promise.resolve()
    // console.log(params)
  })
})
