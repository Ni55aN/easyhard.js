import * as Rx from 'rxjs'
import { DebugObservable, DebugOperator, decorateObservable, decorateObservableFactory, decorateOperator } from '../src/utils'

describe('debug', () => {
  it('operator - map', () => {
    const map = decorateOperator(Rx.map)
    const operator = map(() => null) as DebugOperator

    expect(operator.__debug).toBeTruthy()
    expect(operator.__debug?.id).toEqual(expect.any(String))
    expect(operator.__debug?.name).toEqual('map')
    expect(operator.__debug?.parent).toHaveLength(0)
  })

  it('operator - mergeMap', () => {
    const mergeMap = decorateOperator(Rx.mergeMap)
    const operator = mergeMap(() => Rx.of(true)) as DebugOperator

    Rx.of(true).pipe(operator).subscribe()

    expect(operator.__debug).toBeTruthy()
    expect(operator.__debug?.id).toEqual(expect.any(String))
    expect(operator.__debug?.name).toEqual('mergeMap')
    expect(operator.__debug?.parent).toHaveLength(1)
    expect(operator.__debug?.parent[0]).toBeInstanceOf(Rx.Observable)
  })

  it('of', () => {
    const of = decorateObservableFactory(Rx.of)
    const instance = of(true) as DebugObservable

    expect(instance.__debug).toBeTruthy()
    expect(instance.__debug?.id).toEqual(expect.any(String))
    expect(instance.__debug?.name).toEqual('of')
    expect(instance.__debug?.parent).toHaveLength(0)
  })

  it('Observable', () => {
    const observable = Rx.of(true)

    const instance = decorateObservable(observable, 'test') as DebugObservable

    expect(instance.__debug).toBeTruthy()
    expect(instance.__debug?.id).toEqual(expect.any(String))
    expect(instance.__debug?.name).toEqual('test')
    expect(instance.__debug?.parent).toHaveLength(0)
  })

  it('pipe parent', () => {
    const instance = decorateObservable(Rx.of(true), 'of')
    const map = decorateOperator(Rx.map)

    const ob = instance.pipe(map(() => true), map(() => true)) as DebugObservable

    const parent1 = ob.__debug?.parent.flat()[0] as DebugObservable
    const parent2 = (ob.__debug?.parent.flat()[0] as DebugObservable).__debug?.parent.flat()[0] as DebugObservable

    expect(ob.__debug?.name).toEqual('map')
    expect(parent1.__debug?.name).toEqual('map')
    expect(parent2.__debug?.name).toEqual('of')
  })
})
