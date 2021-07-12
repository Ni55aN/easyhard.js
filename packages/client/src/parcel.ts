import { Cookie, RequestMapper, Transformer, ResponseMapper } from 'easyhard-bridge'
import { getUID } from 'easyhard-common'
import { Observable } from 'rxjs'

export class Parcel {
  static requestTransformer = new Transformer<RequestMapper, 0, 1, null>({
    __ob:  item => item instanceof Observable && { __ob: getUID() },
    __file: item => item instanceof File && { __file: `file-${getUID()}` },
    __cookie: item => item instanceof Cookie && { __cookie: `cookie-${getUID()}` },
    __date: item => item instanceof Date && { __date: item.toISOString()}
  })
  static responseTransformer = new Transformer<ResponseMapper, 1, 2, null>({
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
}
