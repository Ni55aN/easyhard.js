import { $$Return, Cookie } from 'easyhard-common'

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
  }
}
