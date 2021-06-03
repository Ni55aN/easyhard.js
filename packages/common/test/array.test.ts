import fc from 'fast-check'
import { firstValueFrom } from 'rxjs'
import { TestScheduler } from 'rxjs/testing'
import { $$, collectionLength } from '../src/index'

describe('collection', () => {
  const anyPrimitive = fc.oneof(fc.integer(), fc.string(), fc.boolean())

  it('primitives', () => {
    fc.assert(fc.property(fc.array(anyPrimitive), value => {
      expect($$(value).value).toEqual(value)
    }))
  })

  it('clear', () => {
    const collection$ = $$([1,2,3])

    expect(collection$.value).not.toEqual([])
    collection$.clear()
    expect(collection$.value).toEqual([])

    collection$.insert(4)
    expect(collection$.value).not.toEqual([])
    collection$.clear()
    expect(collection$.value).toEqual([])
  })

  describe('insert', () => {
    it('without index', () => {
      fc.assert(fc.property(anyPrimitive, fc.array(anyPrimitive), (val, arr) => {
        const collection$ = $$([...arr])
        expect(collection$.value).toEqual(arr)
        collection$.insert(val)

        expect(collection$.value).toEqual([...arr, val])
      }))
    })
  })

  it('remove', () => {
    fc.assert(fc.property(fc.integer({ min: -4, max: 100 }), fc.array(anyPrimitive), (index, arr) => {
      const collection$ = $$([...arr])
      const target = arr[index]
      collection$.remove(target)
      const firstIndex = arr.indexOf(target)

      expect(collection$.value).toEqual(arr.filter((_, i) => i !== firstIndex))
    }))
  })

  it('length', async () => {
    await fc.assert(fc.asyncProperty(fc.array(anyPrimitive), fc.scheduler(), async arr => {
      const collection$ = $$([...arr])
      const l = await firstValueFrom(collection$.pipe(collectionLength()))

      expect(l).toBe(arr.length)
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
})
