import { getUID } from 'easyhard-common'

export function upload(url: string, id: string, file: File): void {
  if (!file) return
  const xhr = new XMLHttpRequest()

  xhr.upload.onprogress = function(event) {
    console.log(event.loaded, ' / ', event.total) // TODO
  }

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
}

export function useHttp(getUrl: () => string | undefined): { transform: <T>(item: T) => boolean | string, upload: (id: string, item: File) => void } {
  return {
    transform(item) {
      return item instanceof File && getUID()
    },
    upload(id, file) {
      const url = getUrl()

      url && upload(url, id, file)
    }
  }
}
