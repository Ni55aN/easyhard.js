import fs from 'fs'
import { writeFile } from 'easyhard-server'
import { map, mergeMap, scan } from 'rxjs/operators'
import { UploadActions } from '../../shared'
import { easyhardServer } from 'easyhard-server-uws'

// TODO copypaste
export default easyhardServer<UploadActions>({
  uploadFile: mergeMap((params) => {
    params.file.pipe(scan((acc, item: Buffer) => acc + item.length, 0)).subscribe(value => console.log(`Loaded ${value} bytes of second stream`))
    return params.file.pipe(
      writeFile(() => fs.createWriteStream(params.name)),
      scan((acc, buffer) => acc + buffer.length, 0),
      map(loaded => ({ progress: loaded / params.size }))
    )
  })
})
