/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { getUID } from 'easyhard-common-alias'
import { Observable, OperatorFunction, UnaryFunction } from 'rxjs'

type DebugMeta = { __debug?: { id: string, name: string, parent: MestedDebugObject[] } }
type MestedDebugObject = DebugObject | MestedDebugObject[]
type DebugOperator = OperatorFunction<any, any> & DebugMeta
type DebugObservable = Observable<any> & DebugMeta
type DebugClass<T extends { pipe: any }> = ({ new(...args: any[]): T } & DebugMeta)
type DebugObject = DebugOperator | DebugObservable | (UnaryFunction<any, any> & DebugMeta) | DebugClass<any>

function assignMeta(object: DebugObject, name: string) {
  if (object.__debug) console.warn('__debug already defined in ', object)
  if (!object.__debug) {
    object.__debug = {
      id: getUID(),
      name,
      parent: []
    }
  }
  return object.__debug
}

type FunctionalArgument = (...args: unknown[]) => unknown & DebugMeta

function decorateArguments<T extends FunctionalArgument[]>(args: T, emit: { observable: (value: Observable<any>) => void }) {
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
    return arg
  }) as T
}

export function decorateOperator<Args extends never[], Return extends DebugObject, Operator extends (...args: Args) => Return>(operator: Operator): Operator {
  return <Operator>((...args) => {
    const processedArgs = decorateArguments(args, {
      observable: value => debug.parent.push(value)
    })
    const op = operator(...processedArgs)
    const debug = assignMeta(op, operator.name)

    debug.parent.push(...processedArgs.filter(isDebugLike))

    return op
  })
}

export function decoratePipe(context: any, pipe: any) {
  const piped = (...operations: OperatorFunction<any, any>[]): Observable<any> => {
    const piped = pipe.apply(context, operations.map((op: DebugOperator) => {
      if (!op.__debug) { // set operator as unknown if __debug wasnt specified before
        assignMeta(op, 'unknown')
      }
      if (!op.__debug) return // prevent TS error

      const func = (source: Observable<any>) => {
        if (!op.__debug) return // prevent TS error
        const res = op(source)
        const debug = assignMeta(res, op.__debug.name)

        debug.parent.push(source, op.__debug.parent ? op.__debug.parent : []) // TODO condition

        return res
      }

      assignMeta(func, op.__debug.name)

      return func
    }))
    piped.pipe = decoratePipe(piped, piped.pipe)

    return piped
  }
  assignMeta(piped, 'pipe')

  return piped
}

export function decorateObservableFactory<Ob extends (...args: any[]) => Observable<any>>(factory: Ob): Ob {
  return <Ob>((...args) => {
    const processedArgs = decorateArguments(args, {
      observable: value => debug.parent.push(value)
    })
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const ob = factory(...processedArgs)
    const debug = assignMeta(ob, factory.name)
    const parents: DebugObject[] = processedArgs.filter(isDebugLike)

    debug.parent.push(...parents)

    ob.pipe = decoratePipe(ob, ob.pipe)

    return ob
  })
}

export function decorateObservable(ob: Observable<number>, name: string) {
  assignMeta(ob, name)

  ob.pipe = decoratePipe(ob, ob.pipe)

  return ob
}

function isDebugLike(object: number | string | DebugObject) {
  return object && typeof object === 'object' && '__debug' in object
}
