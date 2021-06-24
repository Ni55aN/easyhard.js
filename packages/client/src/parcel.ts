import { Cookie, ExtractPayload, RequestMapper, Transformer, ObjectMapping, Payload } from 'easyhard-bridge'
import { getUID } from 'easyhard-common'
import { HttpBody, HttpHeaders } from './http'
import { SocketRequest } from './types'

const transformer = new Transformer<RequestMapper, 0, 1>({
  __file: item => item instanceof File && { __file: getUID() },
  __cookie: item => item instanceof Cookie && { __cookie: getUID() }
})

export class Parcel<T, K extends keyof T> {
  readonly id: string
  private transformedPayload?: ObjectMapping<ExtractPayload<T[K], 'request'>, RequestMapper, 0, 1>

  constructor(readonly action: K, private payload?: ExtractPayload<T[K], 'request'>) {
    this.id = getUID()
    this.transformedPayload = payload && transformer.apply(payload)
  }

  getInitWSPackage(): SocketRequest<T> {
    return {
      id: this.id,
      action: this.action,
      payload: this.transformedPayload
    }
  }

  getDestroyWSPackage(): SocketRequest<T> {
    return {
      id: this.id,
      unsubscribe: true
    }
  }

  getHttpPackages(): { headers: HttpHeaders, body: HttpBody }[] {
    if (!this.payload || !this.transformedPayload) return []

    const diffs = transformer.diffs(this.payload as Payload, this.transformedPayload as Payload)

    return diffs.map(item => {
      if (item.from instanceof File && '__file' in item.to) return { headers: { 'file-id': item.to.__file } as HttpHeaders, body: item.from }
      if (item.from instanceof Cookie && '__cookie' in item.to) return { headers: { 'cookie-id': item.to.__cookie, 'cookie-key': item.from.key } as HttpHeaders, body: null }
      throw new Error('invalid item')
    })
  }
}
