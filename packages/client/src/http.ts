import { getUID } from 'easyhard-common'

export function useHttp(getUrl: () => string | undefined): { transform: <T>(item: T) => boolean | string, upload: (id: string, item: File) => void } {
  return {
    transform(item) {
      return item instanceof File && getUID()
    },
    upload(id, file) {
      const url = getUrl()

      if (!url) throw new Error('url is not defined')
      const xhr = new XMLHttpRequest()

      xhr.onload = xhr.onerror = function() { // TODO
        if (this.status == 200) {
          console.log('success')
        } else {
          console.log('error', this.status)
        }
      }

      xhr.open('POST', url, true)
      xhr.setRequestHeader('file-id', id)
      xhr.send(file)

      return xhr
    }
  }
}
