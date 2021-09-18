import { easyhardServer, SetCookie } from 'easyhard-server'
import { map, mergeMap } from 'rxjs/operators'
import { CookieActions } from '../shared'

export default easyhardServer<CookieActions>({
  sendCookie: mergeMap((params) => {
    return params.value.pipe(map(value => ({ value, ok: true, })))
  }),
  setCookie: map(() => ({
    newCookie: new SetCookie('test-new', new Date().toISOString(), { path: '/test' }),
    newCookie2: new SetCookie('test-new2', new Date().toISOString(), { path: '/', httpOnly: true })
  }))
})
