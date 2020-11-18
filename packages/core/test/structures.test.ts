import fc from 'fast-check'
import { first } from 'rxjs/operators'
import { $, $$ } from '../src/index'

describe('structures', () => {
  const anyPrimitive = fc.oneof(fc.integer(), fc.string(), fc.boolean())

  describe('value', () => {
    it('primitives', () => {
      fc.assert(fc.property(anyPrimitive, value => {
        expect($(value).value).toEqual(value)
      }))
    })
  })

  describe('array', () => {
    it('primitives', () => {
      fc.assert(fc.property(fc.array(anyPrimitive), value => {
        expect($$(value).value).toEqual(value)
      }))
    })

    it('clear', () => {
      const array$ = $$([1,2,3])

      expect(array$.value).not.toEqual([])
      array$.clear()
      expect(array$.value).toEqual([])

      array$.insert(4)
      expect(array$.value).not.toEqual([])
      array$.clear()
      expect(array$.value).toEqual([])
    })

    describe('insert', () => {
      it('without index', () => {
        fc.assert(fc.property(anyPrimitive, fc.array(anyPrimitive), (val, arr) => {
          const array$ = $$([...arr])
          expect(array$.value).toEqual(arr)
          array$.insert(val)

          expect(array$.value).toEqual([...arr, val])
        }))
      })

      it('with index', () => {
        fc.assert(fc.property(anyPrimitive, fc.array(anyPrimitive), (val, arr) => {
          const index = fc.integer({ min: 0, max: Math.max(arr.length - 1, 0) })
          fc.assert(fc.property(index, index => {
            const array$ = $$([...arr])
            array$.insert(val, index)

            expect(array$.value).toEqual([...arr.slice(0, index), val, ...arr.slice(index)])
          }))
        }))
      })
    })
  
    it('remove', () => {
      fc.assert(fc.property(fc.integer({ min: -4, max: 100 }), fc.array(anyPrimitive), (index, arr) => {
        const array$ = $$([...arr])
        array$.removeAt(index)

        expect(array$.value).toEqual(arr.filter((_, i) => i !== index))
      }))
    })

    it('length', async () => {
      await fc.assert(fc.asyncProperty(fc.array(anyPrimitive), fc.scheduler(), async arr => {
        const array$ = $$([...arr])
        const l = await array$.length.pipe(first()).toPromise()

        expect(l).toBe(arr.length)
      }))
    })

    it('get', async () => {
      await fc.assert(fc.asyncProperty(fc.integer({ min: -4, max: 100 }), fc.array(anyPrimitive), async (index, arr) => {
        const array$ = $$([...arr])
        const v = await array$.get(index).pipe(first()).toPromise()

        expect(v).toEqual([...arr][index])
      }))
    })

    it('set', () => {
      fc.assert(fc.property(fc.integer({ min: -4, max: 100 }), anyPrimitive, fc.array(anyPrimitive), (index, value, arr) => {
        const array$ = $$([...arr])
        array$.set(index, value)

        const actual = array$.value[index]
        const expected = (index < 0 || index > [...arr].length) ? undefined : value

        expect(actual).toEqual(expected)
      }))
    })
  })
})