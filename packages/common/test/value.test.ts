import fc from 'fast-check'
import { $ } from '../src/structures/value'

describe('value', () => {
  const anyPrimitive = fc.oneof(fc.integer(), fc.string(), fc.boolean())

  describe('value', () => {
    it('primitives', () => {
      fc.assert(fc.property(anyPrimitive, value => {
        expect($(value).value).toEqual(value)
      }))
    })
  })
})
