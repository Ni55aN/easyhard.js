import { defer, MonoTypeOperatorFunction } from 'rxjs'
import fs from 'fs'
import { mergeMap, tap } from 'rxjs/operators'

export function writeFile(getStream: () => fs.WriteStream): MonoTypeOperatorFunction<Buffer> {
  return source => defer(() => {
    const stream = getStream()

    return source.pipe(
      mergeMap(buffer => {
        return new Promise<Buffer>((res, rej) => {
          stream.write(buffer, error => {
            if (error) {
              return rej(error)
            } else {
              res(buffer)
            }
          })
        })
      }),
      tap({
        complete: () => stream.close()
    }))
  })
}
