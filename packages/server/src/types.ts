import { ExtractPayload } from 'easyhard-common'
import { Observable } from 'rxjs'
import { FindNonNullableField } from './utility-types'

export type Transformers = {
  __file: [File, string, Observable<Buffer>]
}

export type TransformHandlerPayload<T> = { [K in keyof T]: FindNonNullableField<{
  [KK in keyof Transformers]: T[K] extends Transformers[KK][0] ? Transformers[KK][2] : undefined
}> }

export type Handler<T> = (
 payload: TransformHandlerPayload<ExtractPayload<T, 'request'>>
) => Observable<ExtractPayload<T, 'response'>>

export type Handlers<T> = {
  [K in keyof T]: Handler<T[K]>
}
