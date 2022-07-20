import { easyhardResponser } from 'easyhard-post-message'
import { interval, map, mapTo, Observable, OperatorFunction, pipe, tap } from 'rxjs'


type M = {
  getData: Observable<number>
  setData: OperatorFunction<number, void>
}
const isWorker = typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope

easyhardResponser<M>(isWorker ? self : window, {
  getData: interval(500).pipe(map(v => v * 2)),
  setData: pipe(tap(v => console.log(v)), mapTo(undefined))
})
