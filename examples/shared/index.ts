import { $$Return } from 'easyhard-common'

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
  }
}
