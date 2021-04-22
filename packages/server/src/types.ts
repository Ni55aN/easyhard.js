import { ExtractPayload } from 'easyhard-common'
import { Observable } from 'rxjs'

export type Handler<T> = (
 payload?: ExtractPayload<T, 'request'>
) => Observable<ExtractPayload<T, 'response'>>

export type Handlers<T> = {
  [K in keyof T]: Handler<T[K]>
}
