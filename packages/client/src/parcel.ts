import { Cookie, ExtractPayload, RequestMapper, Transformer, ObjectMapping, Payload, ResponseMapper } from 'easyhard-bridge'
import { getUID } from 'easyhard-common'
import { Observable } from 'rxjs'
import { HttpBody, HttpHeaders } from './http'
import { SocketRequest } from './types'

export class Parcel<T, K extends keyof T> {
  readonly id: string
  private transformedPayload?: ObjectMapping<ExtractPayload<T[K], 'request'>, RequestMapper, 0, 1>
  private requestTransformer = new Transformer<RequestMapper, 0, 1>({
    __file: item => item instanceof File && { __file: getUID() },
    __cookie: item => item instanceof Cookie && { __cookie: getUID() },
    __date: item => item instanceof Date && { __date: item.toISOString()},
    __observable: item => item instanceof Observable && { __observable: getUID() }
  })
  private responseTransformer = new Transformer<ResponseMapper, 1, 2>({
    __cookie: arg => typeof arg === 'object' && '__cookie' in arg && new Cookie(arg.__cookie),
    __error: arg => {
      if (typeof arg === 'object' && '__error' in arg) {
        const error = new Error()
        Object.getOwnPropertyNames(arg.__error).forEach(key => {
          Object.defineProperty(error, key, { value: arg.__error[key] })
        })
        return error
      }
      return false
    },
    __date: arg => typeof arg === 'object' && '__date' in arg && new Date(arg.__date)
  })

  constructor(readonly action: K, private payload?: ExtractPayload<T[K], 'request'>) {
    this.id = getUID()
    this.transformedPayload = payload && this.requestTransformer.apply(payload)
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

    const diffs = this.requestTransformer.diffs(this.payload as Payload, this.transformedPayload as Payload)

    return diffs.map(item => {
      if (item.from instanceof File && '__file' in item.to) {
        return { headers: { 'file-id': item.to.__file } as HttpHeaders, body: item.from }
      }
      if (item.from instanceof Cookie && '__cookie' in item.to) {
        return { headers: { 'cookie-id': item.to.__cookie, 'cookie-key': item.from.key } as HttpHeaders, body: null }
      }
      return null
    }).filter((item): item is Exclude<typeof item, null> => {
      return Boolean(item)
    })
  }

  findObservable(id: string): Observable<unknown> | undefined {
    const diffs = this.requestTransformer.diffs(this.payload as Payload, this.transformedPayload as Payload)

    return diffs.find(({ from, to }) => {
      return from instanceof Observable && '__observable' in to && to.__observable === id
    })?.from as Observable<unknown>
  }

  acceptError<E>(error: E): ReturnType<Transformer<ResponseMapper, 1, 2>['prop']> {
    return this.responseTransformer.prop(error)
  }

  acceptResponse<P>(payload: P): ReturnType<Transformer<ResponseMapper, 1, 2>['apply']>  {
    return this.responseTransformer.apply(payload)
  }
}
