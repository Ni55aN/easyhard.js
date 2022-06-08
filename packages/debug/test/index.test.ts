import * as Rx from 'rxjs'
import { DebugObservable, decorateObservable, decorateObservableFactory, decorateOperator } from '../src/utils'

describe('debug', () => {
  it('operator - map', () => {
    const map = decorateOperator(Rx.map)
    const operator = map(() => null)
    const observable = operator(Rx.EMPTY) as DebugObservable

    expect(observable.__debug).toBeTruthy()
    expect(observable.__debug?.id).toEqual(expect.any(String))
    expect(observable.__debug?.name).toEqual('map')
    expect(observable.__debug?.parent).toHaveLength(1)
  })

  it('operator - mergeMap', () => {
    const mergeMap = decorateOperator(Rx.mergeMap)
    const operator = mergeMap(() => Rx.of(true))

    const observable = Rx.of(true).pipe(operator) as DebugObservable

    observable.subscribe()

    expect(observable.__debug).toBeTruthy()
    expect(observable.__debug?.id).toEqual(expect.any(String))
    expect(observable.__debug?.name).toEqual('mergeMap')
    expect(observable.__debug?.parent).toHaveLength(2)
    expect(observable.__debug?.parent[0]).toBeInstanceOf(Rx.Observable)
    expect(observable.__debug?.parent[1]).toBeInstanceOf(Rx.Observable)
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
