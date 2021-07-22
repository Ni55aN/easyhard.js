import { Cookie } from 'easyhard-bridge'
import { $$Return } from 'easyhard-common'
import { Observable } from 'rxjs'

export interface Actions {
  getData: {
    response: { count: number }
  },
  getArray: {
    response: $$Return<number>
  },
  getDataWithParams: {
    request: { num: number }
    response: { count: string }
  },
  getDataError: {
    response: { count: number }
  },
  uploadFile: {
    request: { name: string, file: File, size: number }
    response: { progress: number }
  },
  sendCookie: {
    request: { value: Cookie }
    response: { value: string | null, ok?: boolean }
  },
  setCookie: {
    response: { newCookie: Cookie }
  },
  getDate: {
    request: { date: Date }
    response: { date: Date, date2: Date }
  },
  passObservable: {
    request: { value: Observable<number> }
    response: { value: number }
  },
  emptyResponse: {
    request: { value: number }
  }
}
