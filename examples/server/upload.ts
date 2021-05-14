import { easyhardServer } from 'easyhard-server'
import multer from 'multer'
import { ActionsUpload } from '../shared'
import { of } from 'rxjs'
import fs from 'fs'

const buffersMap: {
  [filename: string]: Buffer[]
 } = {}

export default easyhardServer<ActionsUpload>({
  upload(params) {
    if (!params) throw new Error('params')
    const buffers = buffersMap[params.filename] || (buffersMap[params.filename] = [])

    const buffer = Buffer.from(params.chunk, 'utf16le')
    // const buffer = Buffer.from(params.chunk, 'base64')

    buffers[params.index] = buffer

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    if (buffers.length === params.numberOfChunks && !buffers.includes(undefined)) {
      const buf = Buffer.concat(buffers)
      fs.writeFile(params.filename, buf, 'binary', err => {
        console.log(err)
        delete buffersMap[params.filename]
      })
    }

    return of(true)
  }
})

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname)
  }
})
export const mult = multer({ storage: storage })
