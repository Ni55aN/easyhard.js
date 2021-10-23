import { TextDecoder } from 'util'

const decoder = new TextDecoder('utf-8')

export function arrayBufferToString(data: ArrayBuffer) {
    return decoder.decode(new Uint8Array(data))
}

export function arrayBufferToBuffer(data: ArrayBuffer) {
    var buf = Buffer.alloc(data.byteLength);
    var view = new Uint8Array(data);
    for (var i = 0; i < buf.length; ++i) {
        buf[i] = view[i];
    }
    return buf;
}
