/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { getUID } from 'easyhard-common-alias'
import { Observable, OperatorFunction, UnaryFunction } from 'rxjs'

export type DebugMeta = { __debug?: { id: string, name: string | symbol, parent: MestedDebugObject[] } }
export type MestedDebugObject = DebugObject | MestedDebugObject[]
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

type FunctionalArgument = (...args: unknown[]) => unknown & DebugMeta

export function decorateArguments<T extends FunctionalArgument[]>(args: T, emit: { observable: (value: Observable<any>) => void }) {
  return args.map(arg => {
    const isDebugOperator = Boolean(arg && (arg as DebugMeta).__debug)

    if (typeof arg == 'function' && !isDebugOperator) {
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
      observable: value => {
        parent.push(value)
      }
    })
    const operator = operatorDeclaration(...processedArgs)

    const op = (source: Observable<unknown> & DebugMeta) => {
      const observable = operator(source)
      assignMeta(observable, operatorDeclaration.name, parent)
      parent.push(source)
      return observable
    }

    return op
  })
}

export function decorateObservableFactory<Ob extends (...args: any[]) => Observable<any>>(factory: Ob): Ob {
  return <Ob>((...args) => {
    const parent: MestedDebugObject[] = []
    const processedArgs = decorateArguments(args, {
      observable: value => parent.push(value)
    })
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const ob = factory(...processedArgs)

    assignMeta(ob, factory.name, parent)

    return ob
  })
}

export function decorateObservable(ob: Observable<any>, name: string) {
  assignMeta(ob, name)

  return ob
}

export function decorateClass<T extends { pipe: any } & DebugMeta>(ident: DebugClass<T>): { new (): T } {
  return new Proxy(ident, {
    construct(target, args) {
      const parent: MestedDebugObject[] = []
      const processedArgs = decorateArguments(args, {
        observable: value => parent.push(value)
      })
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      const instance = new target(...processedArgs)

      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      assignMeta(instance as any, ident.name, parent)

      return instance
    }
  })
}
