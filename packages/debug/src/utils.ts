/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { getUID } from 'easyhard-common-alias'
import { Observable, OperatorFunction, UnaryFunction } from 'rxjs'

export type DebugMeta = { __debug?: { id: string, name: string | symbol, parent: MestedDebugObject[] } }
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
      parent
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

    return ob
  })
}

export function decorateObservable(ob: Observable<any>, name: string) {
  assignMeta(ob, name)

  return ob
}

type Method = (ctx: any, method: (...args: any[]) => any, args: any[]) => any

export function decorateClass<T extends { pipe: any } & DebugMeta>(ident: DebugClass<T>, methods?: {[key in keyof T]?: Method}): { new (): T } {
  return new Proxy(ident, {
    construct(target, args) {
      const parent: MestedDebugObject[] = []
      const processedArgs = decorateArguments(args, {
        observable: value => parent.push({ type: 'argument', link: value })
      })
      const instance = new target(...processedArgs)

      assignMeta(instance as any, ident.name, parent)

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
    assignMeta(ob, 'Observable', [ctx])
  }

  return ob
}
