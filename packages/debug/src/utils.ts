/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { getUID } from 'easyhard-common-alias'
import { ReplaySubject } from 'rxjs-alias'
import { Observable, Observer, OperatorFunction, UnaryFunction } from 'rxjs'

export type DebugMeta = {
  __debug?: {
    id: string,
    name: string | symbol,
    parent: MestedDebugObject[],
    nextBuffer: ReplaySubject<{ value: any, time: number }>
    subscribe: ReplaySubject<number>
    unsubscribe: ReplaySubject<number>
  }
}
export type Parent = { type: 'argument' | 'other', link: DebugObject }
export type MestedDebugObject = Parent | MestedDebugObject[]
export type DebugOperator = OperatorFunction<any, any> & DebugMeta
export type DebugObservable = Observable<any> & DebugMeta
export type DebugClass<T extends { pipe: any }> = ({ new(...args: any[]): T } & DebugMeta)
export type DebugObject = DebugOperator | DebugObservable | (UnaryFunction<any, any> & DebugMeta) | DebugClass<any>

export function assignMeta(object: DebugObject, name: string | symbol, parent: MestedDebugObject[] = []) {
  // if (object.__debug) console.warn('__debug already defined in ', object)
  if (!object.__debug) {
    object.__debug = {
      id: getUID(),
      name,
      parent,
      nextBuffer: new ReplaySubject(),
      subscribe: new ReplaySubject(),
      unsubscribe: new ReplaySubject()
    }
  }
  return object.__debug
}

type FunctionalArgument = ((...args: unknown[]) => unknown) | (Observable<any> & DebugMeta)

export function decorateArguments<T extends FunctionalArgument[]>(args: T, emit: { observable: (value: Observable<any>) => void }) {
  return args.map(arg => {
    if (typeof arg == 'function') {
      return (...params: Parameters<typeof arg>) => {
        const result = arg(...params)
        if (result instanceof Observable) {
          emit.observable(result)
        }
        return result
      }
    }
    if (arg instanceof Observable) {
      emit.observable(arg)
    }
    return arg
  }) as T
}


function decorateNext<T, V>(ctx: T, source: DebugObservable, _next: (value: V) => any) {
  const next = _next

  return (value: any) => {
    if (!source.__debug) throw new Error('source should have __debug property')
    source.__debug.nextBuffer.next({ value, time: Date.now() })

    return next.call(ctx, value)
  }
}

function trackEmission(ob: DebugObservable) {
  let subscriptionsCount = 0
  const sub = ob.subscribe
  ob.subscribe = <T>(
    observerOrNext?: any | Partial<Observer<T>> | ((value: T) => void) | null,
    error?: ((error: any) => void) | null,
    complete?: (() => void) | null
  ) => {
    if (observerOrNext && 'next' in observerOrNext) {
      observerOrNext.next = decorateNext(observerOrNext, ob, observerOrNext.next)
    } else if (typeof observerOrNext === 'function') {
      observerOrNext = decorateNext(null, ob, observerOrNext)
    }

    const subscription = sub.call(ob, observerOrNext, error, complete)

    subscription.add(() => ob.__debug?.unsubscribe.next(--subscriptionsCount))
    ob.__debug?.subscribe.next(++subscriptionsCount)

    return subscription
  }

  return ob
}

type Operator<K, L> = UnaryFunction<Observable<K> & DebugMeta, Observable<L> & DebugMeta>

export function decorateOperator<Args extends any[], OperatorDeclaration extends (...args: Args) => Operator<any, any>>(operatorDeclaration: OperatorDeclaration): OperatorDeclaration {
  return <OperatorDeclaration>((...args: Args) => {
    const parent: MestedDebugObject[] = []
    const processedArgs = decorateArguments(args, {
      observable: value => parent.push({ type: 'argument', link: value })
    })
    const operator = operatorDeclaration(...processedArgs)

    const op = (source: Observable<unknown> & DebugMeta) => {
      const observable = operator(source)

      assignMeta(observable, operatorDeclaration.name, [{ type: 'other', link: source }, parent])
      trackEmission(observable)

      return observable
    }

    return op
  })
}

export function decorateObservableFactory<Ob extends (...args: any[]) => Observable<any>>(factory: Ob): Ob {
  return <Ob>((...args) => {
    const parent: MestedDebugObject[] = []
    const processedArgs = decorateArguments(args, {
      observable: value => parent.push({ type: 'argument', link: value })
    })
    const ob = factory(...processedArgs)

    assignMeta(ob, factory.name, parent)
    trackEmission(ob)

    return ob
  })
}

export function decorateObservable(ob: Observable<any>, name: string) {
  assignMeta(ob, name)
  trackEmission(ob)

  return ob
}

type Method = (ctx: Observable<any>, method: (...args: any[]) => any, args: any[]) => any

export function decorateClass<T extends Observable<any> & DebugMeta>(ident: DebugClass<T>, methods?: {[key in keyof T]?: Method}): { new (): T } {
  return new Proxy(ident, {
    construct(target, args) {
      const parent: MestedDebugObject[] = []
      const processedArgs = decorateArguments(args, {
        observable: value => parent.push({ type: 'argument', link: value })
      })
      const instance = new target(...processedArgs)

      assignMeta(instance, ident.name, parent)
      trackEmission(instance)

      methods && Object.entries(methods).forEach(([key, newMethod]: [string, Method]) => {
        const method = (instance as any)[key]

        ;(instance as any)[key] = (...args: any[]) => {
          return newMethod(instance, method, args)
        }
      })

      return instance
    }
  })
}

export const decorateAsObservable: Method = (ctx, method, args) => {
  const ob = method.call(ctx, args)

  if (ob instanceof Observable) {
    assignMeta(ob, 'Observable', [{ type: 'other', link: ctx }])
    trackEmission(ob)

    return ob
  }

  return ob
}
