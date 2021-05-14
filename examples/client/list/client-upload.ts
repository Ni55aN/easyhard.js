import { h, onMount } from 'easyhard'
import { easyhardClient } from 'easyhard-client'
import { from, Subject } from 'rxjs'
// import lzutf8 from 'lzutf8'
import { concatMap, map, mapTo, mergeMap, tap } from 'rxjs/operators'
import { ActionsUpload } from '../../shared'
import buffer from 'buffer'

const client = easyhardClient<ActionsUpload>({
  onClose(event) {
    console.log('onClose', event)
  },
  onConnect() {
    console.log('onConnect')
  },
  onError(err) {
    console.log(err)
  }
})

function fileSplitter(size: number) {
  return (file: File) => {
    const numberOfChunks = Math.ceil(file.size / size)

    return from(new Array(numberOfChunks).fill(0).map((_, index) => ({ file, numberOfChunks, index })))
  }
}

async function readChunk(file: File, index: number, size: number) {
  const fr = new FileReader()

  const promise = new Promise<{ index: number, chunk: ArrayBuffer }>((res) => {
    fr.onload = () => {
      res({ index, chunk: fr.result as ArrayBuffer })
    }
  })

  fr.readAsArrayBuffer(file.slice(index * size, (index + 1) * size))

  return promise
}

function App() {
  const file$ = new Subject<File>()
  const CHUNK_SIZE = 1024 * 1024 / 2

  const el = h('div', {},
    file$.pipe(
      mergeMap((file) => {
        const progressSubscriber = new Subject<any>()

        const formData = new FormData()
        formData.append('file', file)

        const xhr = new XMLHttpRequest()

        xhr.upload.onprogress = function(event) {
          progressSubscriber.next(event)
        }

        xhr.onload = xhr.onerror = function() {
          if (this.status == 200) {
            console.log('success')
          } else {
            console.log('error ', this.status)
          }
        }

        xhr.open('POST', '/api/upload', true)
        xhr.send(formData)

        return progressSubscriber
      }),
      map(res => {
        return `${res.loaded / res.total * 100}%`
      })
    ),
    h('br', {}),
    file$.pipe(
      mergeMap(fileSplitter(CHUNK_SIZE)),
      mergeMap(({ file, numberOfChunks, index }) => {
        return from(readChunk(file, index, CHUNK_SIZE)).pipe(
          concatMap(({ index, chunk }) => {

            return client.call('upload', {
              filename: file.name,
              numberOfChunks,
              index,
              chunk: buffer.Buffer.from(chunk).toString('utf16le')
              // chunk: (function () {
              //   let binary = ''
              //   const bytes = new Uint8Array(chunk)
              //   const len = bytes.byteLength
              //   for (let i = 0; i < len; i++) {
              //       binary += String.fromCharCode( bytes[ i ] )
              //   }
              //   return window.btoa(binary)
              // })()
            })
          }),
          mapTo({ progress: (index + 1) / numberOfChunks })
        )
      }, 1),
      map(args => `${args.progress * 100}%`)
    ),
    h('br', {}),
    h('input', { type: 'file', change: tap(e => {
      const { files } = (e.target as HTMLInputElement)
      const file = files?.item(0)
      if (file) file$.next(file)
    })})
  )

  onMount(el, () => client.connect(`ws://${location.host}/api/upload/`))

  return el
}

document.body.appendChild(App())
