import { firstValueFrom, Observable, of, OperatorFunction } from 'rxjs'
import { ObjectMapping } from '../src/utility-types'
import { Cookie, RequestMapper, ExtractPayload } from '../src'
import { Transformer } from '../src/transformer'

type Actions = {
  test: OperatorFunction<{
    a: number,
    b: File,
    c: Cookie
  }, {
    c: number
  }>
}

type RequestPayload = ExtractPayload<Actions['test'], 'request'>

// eslint-disable-next-line @typescript-eslint/no-unused-vars
type k = ObjectMapping<RequestPayload, RequestMapper, 0, 2>
// {
//   a: number;
//   b: Observable<Buffer>;
//   c: Observable<string>;
// }


// export class File {
//   constructor(public data: any, public f: any) {}
// }

const source: RequestPayload = {
  a: 123,
  b: new File([], 'file'),
  c: new Cookie('cookie')
}
const clientToJson = new Transformer<RequestMapper, 0, 1, null>({
  __ob: c => c instanceof Observable && { __ob: 'ob' },
  __cookie: c => c instanceof Cookie && { __cookie: 'cook' },
  __file: c => c instanceof File && { __file: 'file' },
  __date: c => c instanceof Date && { __date: c.toISOString() }
})
const jsonToServer = new Transformer<RequestMapper, 1, 2, null>({
  __ob: c => typeof c === 'object' && '__ob' in c && of(true),
  __cookie: c => typeof c === 'object' && '__cookie' in c && of('cookie'),
  __file: c => typeof c === 'object' && '__file' in c && of(Buffer.from('file')),
  __date: c => typeof c === 'object' && '__file' in c && new Date(c.__file)
})

describe('Transformer', () => {
  it ('prop', async () => {
    const result1 = clientToJson.prop(source.b, null)

    if (!result1) throw new Error('cannot be undefined')
    expect(result1).toEqual({ __file: expect.any(String) })

    const result2 = jsonToServer.prop(result1, null)

    if (!result2) throw new Error('cannot be undefined')
    expect(await firstValueFrom(result2 as unknown as Observable<unknown>)).toBeInstanceOf(Buffer)
  })

  it ('main', async () => {
    const result1 = clientToJson.apply(source, null)

    if (!result1) throw new Error('cannot be undefined')
    expect(result1.a).toEqual(123)
    expect(result1.b).toEqual({ __file: expect.any(String) })
    expect(result1.c).toEqual({ __cookie: expect.any(String) })

    const result2 = jsonToServer.apply(result1, null)

    if (!result2) throw new Error('cannot be undefined')
    expect(result2.a).toEqual(123)
    expect(result2.b).toBeInstanceOf(Observable)
    expect(result2.c).toBeInstanceOf(Observable)

    expect(await firstValueFrom(result2.b as unknown as Observable<unknown>)).toBeInstanceOf(Buffer)
    expect(await firstValueFrom(result2.c as unknown as Observable<unknown>)).toEqual('cookie')
  })

  it ('diffs', () => {
    const result1 = clientToJson.apply(source, null)

    if (!result1) throw new Error('cannot be undefined')
    clientToJson.diffs(source, result1).forEach(item => {
      expect(item.from instanceof File || item.from instanceof Cookie).toBeTruthy()
      expect('__file' in item.to || '__cookie' in item.to).toBeTruthy()
    })
  })
})
