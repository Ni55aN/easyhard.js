import { Cookie } from 'easyhard-bridge'
import { $$Return } from 'easyhard-common'
import { Observable, OperatorFunction } from 'rxjs'

export type GetData = Observable<{ count: number }>
export type PassObservable = OperatorFunction<{ value: Observable<number> }, { value: number }>

export interface BasicActions {
  getData: GetData
  getArray: Observable<$$Return<number>>
  getDataWithParams: OperatorFunction<{ num: number }, { count: string }>
  getDataError: GetData
  emptyResponse: OperatorFunction<{ value: number }, void>
  emptyResponse2: OperatorFunction<{ value: number }, void>
}

export interface CookieActions {
  sendCookie: OperatorFunction<{ value: Cookie }, { value: string | null, ok?: boolean }>
  setCookie: OperatorFunction<void, { newCookie: Cookie, newCookie2: Cookie }>
}

export interface DateActions {
  getDate: OperatorFunction<{ date: Date }, { date: Date, date2: Date }>
}

export interface ObservableActions {
  passObservable: PassObservable
}

export interface ReconnectActions {
  getData: GetData
  passObservable: PassObservable
}

export interface RequestActions {
  requestData: OperatorFunction<void, { ip: string }>
}

export interface UnstableActions {
  passObservable: PassObservable
}

export interface UploadActions {
  uploadFile: OperatorFunction<{ name: string, file: File, size: number }, { progress: number }>
}
