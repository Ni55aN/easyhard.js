import { TextDecoder } from 'util'

const decoder = new TextDecoder('utf-8')

export function arrayBufferToString(data: ArrayBuffer) {
  return decoder.decode(new Uint8Array(data))
}

export function arrayBufferToBuffer(data: ArrayBuffer) {
  const buf = Buffer.alloc(data.byteLength)
  const view = new Uint8Array(data)
  for (let i = 0; i < buf.length; ++i) {
    buf[i] = view[i]
  }
  return buf
}
