import * as Rx from 'rxjs-alias'
import { decorateObservable, decorateObservableFactory, decorateOperator, decoratePipe } from './utils'
import './setup'
import { getUID } from 'easyhard-common'

export * from 'rxjs-alias'

export const audit = decorateOperator(Rx.audit)
export const auditTime = decorateOperator(Rx.auditTime)
export const buffer = decorateOperator(Rx.buffer)
export const bufferCount = decorateOperator(Rx.bufferCount)
export const bufferTime = decorateOperator(Rx.bufferTime)
export const bufferToggle = decorateOperator(Rx.bufferToggle)
export const bufferWhen = decorateOperator(Rx.bufferWhen)
export const catchError = decorateOperator(Rx.catchError)
export const combineAll = decorateOperator(Rx.combineAll)
export const combineLatestAll = decorateOperator(Rx.combineLatestAll)
export const combineLatestWith = decorateOperator(Rx.combineLatestWith)
export const concatAll = decorateOperator(Rx.concatAll)
export const concatMap = decorateOperator(Rx.concatMap)
export const concatMapTo = decorateOperator(Rx.concatMapTo)
export const concatWith = decorateOperator(Rx.concatWith)
export const connect = decorateOperator(Rx.connect)
export const count = decorateOperator(Rx.count)
export const debounce = decorateOperator(Rx.debounce)
export const debounceTime = decorateOperator(Rx.debounceTime)
export const defaultIfEmpty = decorateOperator(Rx.defaultIfEmpty)
export const delay = decorateOperator(Rx.delay)
export const delayWhen = decorateOperator(Rx.delayWhen)
export const dematerialize = decorateOperator(Rx.dematerialize)
export const distinct = decorateOperator(Rx.distinct)
export const distinctUntilChanged = decorateOperator(Rx.distinctUntilChanged)
export const distinctUntilKeyChanged = decorateOperator(Rx.distinctUntilKeyChanged)
export const elementAt = decorateOperator(Rx.elementAt)
export const endWith = decorateOperator(Rx.endWith)
export const every = decorateOperator(Rx.every)
export const exhaust = decorateOperator(Rx.exhaust)
export const exhaustAll = decorateOperator(Rx.exhaustAll)
export const exhaustMap = decorateOperator(Rx.exhaustMap)
export const expand = decorateOperator(Rx.expand)
export const filter = decorateOperator(Rx.filter)
export const finalize = decorateOperator(Rx.finalize)
export const find = decorateOperator(Rx.find)
export const findIndex = decorateOperator(Rx.findIndex)
export const first = decorateOperator(Rx.first)
export const groupBy = decorateOperator(Rx.groupBy)
export const ignoreElements = decorateOperator(Rx.ignoreElements)
export const isEmpty = decorateOperator(Rx.isEmpty)
export const last = decorateOperator(Rx.last)
export const map = decorateOperator(Rx.map)
export const mapTo = decorateOperator(Rx.mapTo)
export const materialize = decorateOperator(Rx.materialize)
export const max = decorateOperator(Rx.max)
export const merge = decorateOperator(Rx.merge)
export const mergeAll = decorateOperator(Rx.mergeAll)
export const flatMap = decorateOperator(Rx.flatMap)
export const mergeMap = decorateOperator(Rx.mergeMap)
export const mergeMapTo = decorateOperator(Rx.mergeMapTo)
export const mergeScan = decorateOperator(Rx.mergeScan)
export const mergeWith = decorateOperator(Rx.mergeWith)
export const min = decorateOperator(Rx.min)
export const multicast = decorateOperator(Rx.multicast)
export const observeOn = decorateOperator(Rx.observeOn)
export const onErrorResumeNext = decorateOperator(Rx.onErrorResumeNext)
export const pairwise = decorateOperator(Rx.pairwise)
// export const partition = decorateOperator(Rx.partition)
export const pluck = decorateOperator(Rx.pluck)
export const publish = decorateOperator(Rx.publish)
// export const publishBehavior = decorateOperator(Rx.publishBehavior) // TODO UnaryFunction
export const publishLast = decorateOperator(Rx.publishLast)
export const publishReplay = decorateOperator(Rx.publishReplay)
// export const race = decorateOperator(Rx.race)
export const raceWith = decorateOperator(Rx.raceWith)
export const reduce = decorateOperator(Rx.reduce)
export const repeat = decorateOperator(Rx.repeat)
export const repeatWhen = decorateOperator(Rx.repeatWhen)
export const retry = decorateOperator(Rx.retry)
export const retryWhen = decorateOperator(Rx.retryWhen)
export const refCount = decorateOperator(Rx.refCount)
export const sample = decorateOperator(Rx.sample)
export const sampleTime = decorateOperator(Rx.sampleTime)
export const scan = decorateOperator(Rx.scan)
export const sequenceEqual = decorateOperator(Rx.sequenceEqual)
export const share = decorateOperator(Rx.share)
export const shareReplay = decorateOperator(Rx.shareReplay)
export const single = decorateOperator(Rx.single)
export const skip = decorateOperator(Rx.skip)
export const skipLast = decorateOperator(Rx.skipLast)
export const skipUntil = decorateOperator(Rx.skipUntil)
export const skipWhile = decorateOperator(Rx.skipWhile)
export const startWith = decorateOperator(Rx.startWith)
export const subscribeOn = decorateOperator(Rx.subscribeOn)
export const switchAll = decorateOperator(Rx.switchAll)
export const switchMap = decorateOperator(Rx.switchMap)
export const switchMapTo = decorateOperator(Rx.switchMapTo)
export const switchScan = decorateOperator(Rx.switchScan)
export const take = decorateOperator(Rx.take)
export const takeLast = decorateOperator(Rx.takeLast)
export const takeUntil = decorateOperator(Rx.takeUntil)
export const takeWhile = decorateOperator(Rx.takeWhile)
export const tap = decorateOperator(Rx.tap)
export const throttle = decorateOperator(Rx.throttle)
export const throttleTime = decorateOperator(Rx.throttleTime)
export const throwIfEmpty = decorateOperator(Rx.throwIfEmpty)
export const timeInterval = decorateOperator(Rx.timeInterval)
export const timeout = decorateOperator(Rx.timeout)
export const timeoutWith = decorateOperator(Rx.timeoutWith)
export const timestamp = decorateOperator(Rx.timestamp)
export const toArray = decorateOperator(Rx.toArray)
export const window = decorateOperator(Rx.window)
export const windowCount = decorateOperator(Rx.windowCount)
export const windowTime = decorateOperator(Rx.windowTime)
export const windowToggle = decorateOperator(Rx.windowToggle)
export const windowWhen = decorateOperator(Rx.windowWhen)
export const withLatestFrom = decorateOperator(Rx.withLatestFrom)
export const zip = decorateOperator(Rx.zip)
export const zipAll = decorateOperator(Rx.zipAll)
export const zipWith = decorateOperator(Rx.zipWith)

export const combineLatest = decorateObservableFactory(Rx.combineLatest)
export const race = decorateObservableFactory(Rx.race)
export const interval = decorateObservableFactory(Rx.interval)
export const timer = decorateObservableFactory(Rx.timer)
export const concat = decorateObservableFactory(Rx.concat)
export const range = decorateObservableFactory(Rx.range)
export const pairs = decorateObservableFactory(Rx.pairs)
export const defer = decorateObservableFactory(Rx.defer)

/* eslint-disable @typescript-eslint/no-unsafe-argument */
export const EMPTY = decorateObservable(Rx.EMPTY, 'EMPTY')
export const NEVER = decorateObservable(Rx.NEVER, 'NEVER')
/* eslint-enable @typescript-eslint/no-unsafe-argument */

export class BehaviorSubject<T> extends Rx.BehaviorSubject<T> {
  __debug = {
    id: getUID(),
    name: 'BehaviorSubject',
    parent: []
  }

  pipe = decoratePipe(this, this.pipe)

}
