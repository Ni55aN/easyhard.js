import { Cookie } from 'easyhard-bridge'
import { $$Return } from 'easyhard-common'
import { Observable, OperatorFunction } from 'rxjs'

export interface Actions {
  getData: Observable<{ count: number }>
  getArray: Observable<$$Return<number>>
  getDataWithParams: OperatorFunction<{ num: number }, { count: string }>
  getDataError: Observable<{ count: number }>
  uploadFile: OperatorFunction<{ name: string, file: File, size: number }, { progress: number }>
  sendCookie: OperatorFunction<{ value: Cookie }, { value: string | null, ok?: boolean }>
  setCookie: OperatorFunction<void, { newCookie: Cookie, newCookie2: Cookie }>
  getDate: OperatorFunction<{ date: Date }, { date: Date, date2: Date }>
  passObservable: OperatorFunction<{ value: Observable<number> }, { value: number }>
  emptyResponse: OperatorFunction<{ value: number }, void>,
  emptyResponse2: OperatorFunction<{ value: number }, void>
}
