import { serializeError } from '../src/utils'

describe('Utils', () => {
  it('serialize', () => {
    const jsonString = JSON.stringify(new Error('test'), serializeError)
    const obj = JSON.parse(jsonString)

    expect(obj.name).toEqual('Error')
    expect(obj.message).toEqual('test')
    expect(typeof obj.stack).toBe('string')
  })

  it('serialize custom fields', () => {
    class CustomError extends Error {
      custom = 'customField'
    }
    const jsonString = JSON.stringify(new CustomError('test'), serializeError)
    const obj = JSON.parse(jsonString)

    expect(obj.custom).toEqual('customField')
  })
})
