import { Cookie, ExtractPayload, getUID } from 'easyhard-common'
import { HttpBody, HttpHeaders } from './http'
import { TransformedPayload, Transformer } from './transform'
import { Transformers, WSPackage } from './types'

const transformer = new Transformer<Transformers>({
  __file: item => item instanceof File && getUID(),
  __cookie: item => item instanceof Cookie && getUID()
})

export class Parcel<T, K extends keyof T> {
  readonly id: string
  private transformedPayload?: TransformedPayload<Transformers>

  constructor(readonly action: K, private payload?: ExtractPayload<T[K], 'request'>) {
    this.id = getUID()
    this.transformedPayload = transformer.apply(payload)
  }

  getInitWSPackage(): WSPackage<T> {
    return {
      id: this.id,
      action: this.action,
      payload: this.transformedPayload
    }
  }

  getDestroyWSPackage(): WSPackage<T> {
    return {
      id: this.id,
      unsubscribe: true
    }
  }

  getHttpPackages(): { headers: HttpHeaders, body: HttpBody }[] {
    if (!this.payload || !this.transformedPayload) return []
    return [
      ...transformer.diffs('__file', this.payload, this.transformedPayload).map(item => ({ headers: { 'file-id': item.to }, body: item.from })),
      ...transformer.diffs('__cookie', this.payload, this.transformedPayload).map(item => ({ headers: { 'cookie-id': item.to, 'cookie-key': item.from.key }, body: null }))
    ]
  }
}
