import { delay } from './utils'

type OnError = (error: Error) => void

export type HttpHeaders = {[key:string]: string}
export type HttpBody = Document | BodyInit | null | undefined
export type HTTP = {
  send: (id: string, headers: HttpHeaders, body?: Document | BodyInit | null | undefined, onError?: OnError) => void,
  abort: (id: string) => void
}

export function useHttp(getUrl: () => string | undefined): HTTP {
  const requestsMap = new Map<string, Set<XMLHttpRequest>>()

  return {
    send(id, headers, body, onError) {
      const url = getUrl()

      if (!url) throw new Error('url is not defined')
      const xhr = new XMLHttpRequest()

      xhr.addEventListener('error', e => {
        onError && onError(new Error((e.target as XMLHttpRequest)?.statusText))
      })
      xhr.addEventListener('timeout', e => {
        onError && onError(new Error((e.target as XMLHttpRequest)?.statusText))
      })

      xhr.addEventListener('loadend', e => {
        const target = e.target as XMLHttpRequest

        requestsMap.get(id)?.delete(xhr)
        if (requestsMap.get(id)?.size === 0) {
          requestsMap.delete(id)
        }

        if (target.status !== 200) {
          onError && onError(new Error(target?.statusText))
        }
      })

      xhr.open('POST', url, true)

      Object.keys(headers).forEach(key => {
        xhr.setRequestHeader(key, headers[key])
      })
      xhr.send(body)

      const set = requestsMap.get(id) || new Set<XMLHttpRequest>()
      set.add(xhr)
      requestsMap.set(id, set)
    },
    async abort(id: string) {
      await delay(500)
      const requestsSet = requestsMap.get(id)

      if (requestsSet) {
        requestsSet.forEach(request => request.abort())
      }
    }
  }
}
