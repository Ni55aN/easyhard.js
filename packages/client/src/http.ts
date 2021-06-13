import { getUID } from 'easyhard-common'

type Return = {
  transform: <T>(item: T) => boolean | string,
  upload: (id: string, item: File,
  onError: (error: Error) => void) => XMLHttpRequest
}

export function useHttp(getUrl: () => string | undefined): Return {
  return {
    transform(item) {
      return item instanceof File && getUID()
    },
    upload(id, file, onError) {
      const url = getUrl()

      if (!url) throw new Error('url is not defined')
      const xhr = new XMLHttpRequest()

      xhr.addEventListener('error', e => {
        onError(new Error((e.target as XMLHttpRequest)?.statusText))
      })
      xhr.addEventListener('timeout', e => {
        onError(new Error((e.target as XMLHttpRequest)?.statusText))
      })
      xhr.addEventListener('load', e => {
        const target = e.target as XMLHttpRequest

        if (target.status !== 200) {
          onError(new Error(target?.statusText))
        }
      })

      xhr.open('POST', url, true)
      xhr.setRequestHeader('file-id', id)
      xhr.send(file)

      return xhr
    }
  }
}
