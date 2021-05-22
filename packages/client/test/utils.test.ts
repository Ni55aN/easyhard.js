import { deserializeError } from '../src/utils'

describe('Utils', () => {
  it('deserialize', () => {
    const error = deserializeError({ __ErrorInstance: true, name: 'Error', message: 'test' })

    expect(error.name).toEqual('Error')
    expect(error.message).toEqual('test')
    expect(error).toBeInstanceOf(Error)
  })

  it('deserialize with custom fields', () => {
    type CustomError = Error & { custom: string }
    const error = deserializeError({ __ErrorInstance: true, name: 'Error', message: 'test', stack: 'stack', custom: 'customField' }) as CustomError

    expect(error.name).toEqual('Error')
    expect(error.message).toEqual('test')
    expect(error.custom).toEqual('customField')
    expect(error).toBeInstanceOf(Error)
  })
})
