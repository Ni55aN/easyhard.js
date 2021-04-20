import { h, $ } from 'easyhard'
import { BehaviorSubject, Observable, of, OperatorFunction } from 'rxjs'
import { map, mergeMap, pluck, tap } from 'rxjs/operators'
import hyperactiv from 'hyperactiv'

const { observe, computed } = hyperactiv

function createState2<T>(object: T) {
  const state = observe(object)

  return {
    get<R>(fn: (state: T) => R): Observable<R> {
      return new Observable(observer => {
        computed(() => {
          observer.next(fn(state))
        })
      })
    },
    set(fn: (state: T) => void) {
      fn(state)
    }
  }
}

////////////////


type Reactify<T> = {
  [P in keyof T]: T[P] extends Record<string, unknown>
  ? $<Reactify<T[P]>>
  : (T[P] extends $<any>
  ? T[P]
  : $<T[P]>)
}

function reactify<T>(object: T): Reactify<T> {
  const entries = Object.entries(object).map(([key, value]): [string, $<unknown> | Reactify<unknown>] => {
    if (value instanceof BehaviorSubject) return [key, value]
    if (typeof value === 'object' && value !== null) return [key, $(reactify(value))]
    return [key, $(value)]
  })

  return entries.reduce((obj, [key, value]) => {
    return { ...obj, [key]: value}
  }, {}) as any
}

function createState<T>(object: T) {
  const state = $(reactify<T>(object))

  function value<K extends keyof T, R = T[K]>(a1: K): R extends $<infer U> ? U : R;
  function value<K1 extends keyof T, K2 extends keyof T[K1], R = T[K1][K2]>(a1: K1, a2: K2): R extends $<infer U> ? U : R;
  function value<K1 extends keyof T, K2 extends keyof T[K1], K3 extends keyof T[K1][K2], R = T[K1][K2][K3]>(a1: K1, a2: K2, a3: K3): R extends $<infer U> ? U : R;
  function value<K1 extends keyof T, K2 extends keyof T[K1], K3 extends keyof T[K1][K2], K4 extends keyof T[K1][K2][K3], R = T[K1][K2][K3][K4]>(a1: K1, a2: K2, a3: K3, a4: K4): R extends $<infer U> ? U : R;
  function value<K1 extends keyof T, K2 extends keyof T[K1], K3 extends keyof T[K1][K2], K4 extends keyof T[K1][K2][K3], K5 extends keyof T[K1][K2][K3][K4], R = T[K1][K2][K3][K4][K5]>(a1: K1, a2: K2, a3: K3, a4: K4, a5: K5): R extends $<infer U> ? U : R;
  function value(...path: string[]) {
    let curr: any = state
    path.forEach(p => {
      curr = curr.value[p]
    })
    return curr.value
  }

  function get<K extends keyof T, R = T[K]>(a1: K): R extends $<any> ? R : $<R>;
  function get<K1 extends keyof T, K2 extends keyof T[K1], R = T[K1][K2]>(a1: K1, a2: K2): R extends $<any> ? R : $<R>;
  function get<K1 extends keyof T, K2 extends keyof T[K1], K3 extends keyof T[K1][K2], R = T[K1][K2][K3]>(a1: K1, a2: K2, a3: K3): R extends $<any> ? R : $<R>
  function get<K1 extends keyof T, K2 extends keyof T[K1], K3 extends keyof T[K1][K2], K4 extends keyof T[K1][K2][K3], R = T[K1][K2][K3][K4]>(a1: K1, a2: K2, a3: K3, a4: K4): R extends $<any> ? R : $<R>
  function get<K1 extends keyof T, K2 extends keyof T[K1], K3 extends keyof T[K1][K2], K4 extends keyof T[K1][K2][K3], K5 extends keyof T[K1][K2][K3][K4], R = T[K1][K2][K3][K4][K5]>(a1: K1, a2: K2, a3: K3, a4: K4, a5: K5): R extends $<any> ? R : $<R>
  function get(...path: string[]) {
    const pipes = path.reduce((arr, p) => ([
      ...arr, pluck(String(p)), map(v => v instanceof Observable ? v : of(null)), mergeMap((v: any) => v)
    ]), [] as any) as [OperatorFunction<unknown, unknown>]
  
    return state.pipe(...pipes)
  }

  function set<V>(value: V): void;
  function set<V, K extends keyof T>(value: V, a1: K): void;
  function set<V, K1 extends keyof T, K2 extends keyof T[K1]>(value: V, a1: K1, a2: K2): void;
  function set<V, K1 extends keyof T, K2 extends keyof T[K1], K3 extends keyof T[K1][K2]>(value: V, a1: K1, a2: K2, a3: K3): void
  function set<V, K1 extends keyof T, K2 extends keyof T[K1], K3 extends keyof T[K1][K2], K4 extends keyof T[K1][K2][K3]>(value: V, a1: K1, a2: K2, a3: K3, a4: K4): void
  function set<V, K1 extends keyof T, K2 extends keyof T[K1], K3 extends keyof T[K1][K2], K4 extends keyof T[K1][K2][K3], K5 extends keyof T[K1][K2][K3][K4]>(value: V, a1: K1, a2: K2, a3: K3, a4: K4, a5: K5): void
  function set(value: any, ...path: string[]) {
    let curr: any = state
    path.forEach(p => {
      curr = curr.value[p]
    })

    if (typeof value === 'object') {
      curr.next(reactify(value))
    } else {
      curr.next(value)
    }
  }
  
  return {
    value,
    get,
    set
  }
}


function App() {
  const t = {
    first: 1,
    second: {
      first: 1,
      second: {
        third: {
          fourth: {
            fifth: 5
          }
        }
      }
    },
    array: [1,2,3],
  }
  const state = createState(t)
  const state2 = createState2(t)

  setTimeout(() => {
    state2.set(state => state.second.second.third.fourth = { fifth: 444444 })
  }, 4000)

  return h('div', {},
    h('div', {}, state2.get(state => state.second).pipe(tap(console.log), map(p => p.second.third.fourth.fifth))),
    h('div', {}, state.get('first')),
    h('div', {}, state.get('second', 'second', 'third', 'fourth', 'fifth')),
    h('button', {
      click: tap(() => {
        const v = state.value('first') + 1

        state.set(v, 'first')
      })
    }, 'update b'),
    h('button', {
      click: tap(() => {
        state.set({
          first: 9,
          array: [9],
          second: {
            first: 6
          }
        })
      })
    }, 'update state')
  )
}

document.body.appendChild(App())