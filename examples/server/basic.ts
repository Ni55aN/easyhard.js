import { $$ } from 'easyhard-common'
import fs from 'fs'
import { easyhardServer, writeFile } from 'easyhard-server'
import { interval, throwError } from 'rxjs'
import { concatMap, map, scan, startWith, take } from 'rxjs/operators'
import { Actions } from '../shared'

export default easyhardServer<Actions>({
  getData() {
    return interval(1000).pipe(
      take(10),
      map(count => ({ count }))
    )
  },
  getArray() {
    const array = $$([1,2,3])

    setTimeout(() => array.insert(4), 3000)
    setTimeout(() => array.remove(2), 4000)
    return array
  },
  getDataWithParams(payload) {
    return interval(500).pipe(
      take(14),
      map(count => ({ count: String(count) + '|' + String(payload.num) }))
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
  },
  uploadFile(params) {
    return params.file.pipe(
      writeFile(() => fs.createWriteStream(params.name)),
      scan((acc, buffer) => acc + buffer.length, 0),
      map(loaded => ({ progress: loaded / params.size }))
    )
  },
  sendCookie(params) {
    return params.value.pipe(startWith(null), map(value => ({ value, ok: true })))
  }
})
