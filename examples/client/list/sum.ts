/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { h, $, $$, $if, $inject, $provide, $for, untilExist } from 'easyhard'
import { getUID } from 'easyhard-common'
import { Observable, combineLatest, defer, interval, of, pipe, Subject, throwError, timer, BehaviorSubject, merge } from 'rxjs'
import { map, take, mapTo, mergeMap, tap, retry, delay, filter, switchMap, finalize, shareReplay, share } from 'rxjs/operators'
import { Input } from '../components/input'

function App() {
  const a = $(20)
  const b = $(0)
  const sum = combineLatest(a, b).pipe(map(([a, b]) => a + b), share())

  return h('div', {},
    $if($(true), () => timer(0, 1000))
    // Input({ model: a, type: 'number' }),
    // ' + ',
    // Input({ model: b, type: 'number' }),
    // ' = ',
    // sum
  )
}

document.body.appendChild(App())
