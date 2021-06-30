import { $$ } from 'easyhard-common'
import fs from 'fs'
import { easyhardServer, SetCookie, writeFile } from 'easyhard-server'
import { interval, of, throwError } from 'rxjs'
import { concatMap, map, scan, take } from 'rxjs/operators'
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
    return params.value.pipe( map(value => ({ value, ok: true,  })))
  },
  setCookie() {
    return of({
      newCookie: new SetCookie('test-new', new Date().toISOString(), { path: '/test' }),
      newCookie2: new SetCookie('test-new2', new Date().toISOString(), { path: '/', httpOnly: true }) })
  },
  getDate(params) {
    return interval(500).pipe(map(() => ({ date: params.date })))
  }
})
