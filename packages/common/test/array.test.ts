import fc from 'fast-check'
import { firstValueFrom, interval, of } from 'rxjs'
import { map } from 'rxjs/operators'
import { TestScheduler } from 'rxjs/testing'
import { $, $$, filterCollection } from '../src/index'

describe('array', () => {
  const anyPrimitive = fc.oneof(fc.integer(), fc.string(), fc.boolean())

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
  })

  it('remove', () => {
    fc.assert(fc.property(fc.integer({ min: -4, max: 100 }), fc.array(anyPrimitive), (index, arr) => {
      const array$ = $$([...arr])
      const target = arr[index]
      array$.remove(target)
      const firstIndex = arr.indexOf(target)

      expect(array$.value).toEqual(arr.filter((_, i) => i !== firstIndex))
    }))
  })

  it('length', async () => {
    await fc.assert(fc.asyncProperty(fc.array(anyPrimitive), fc.scheduler(), async arr => {
      const array$ = $$([...arr])
      const l = await firstValueFrom(array$.length)

      expect(l).toBe(arr.length)
    }))
  })

  it('get', async () => {
    await fc.assert(fc.asyncProperty(fc.integer({ min: -4, max: 100 }), fc.array(anyPrimitive), async (index, arr) => {
      const array$ = $$([...arr])
      const v = await firstValueFrom(array$.get(index))

      expect(v).toEqual([...arr][index])
    }))
  })

  it('filter', () => {
    const arr = $$([1,2,3])

    // const filtered = arr.pipe(
    //   filterCollection(item => item.is)
    // )

    const scheduler = new TestScheduler((actual, expected) => {
      expect(actual).toEqual(expected)
    })
    scheduler.run(({ expectObservable }) => {

      const expected = '(abcd)'
      expectObservable(arr).toBe(expected, {
        a: {
          insert: true,
          batch: true,
          item: 1
        },
        b: {
          insert: true,
          batch: true,
          item: 2
        },
        c: {
          insert: true,
          batch: true,
          item: 3
        },
        d: {
          idle: true
        }
      })
    })
  })

  it('forEach', async () => {

  })

  it('length', async () => {

  })
})
