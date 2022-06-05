/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { getUID } from 'easyhard-common-alias'
import { Observable, OperatorFunction } from 'rxjs'

type DebugMeta = { __debug?: { id: string, name: string, parent: MestedDebugObject[] } }
type MestedDebugObject = DebugObject | MestedDebugObject[]
type DebugOperator = OperatorFunction<any, any> & DebugMeta
type DebugObservable = Observable<any> & DebugMeta
type DebugObject = DebugOperator | DebugObservable

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

type FunctionalArgument = (...args: unknown[]) => unknown

function decorateArguments<T extends FunctionalArgument[]>(args: T, emit: { observable: (value: Observable<any>) => void }) {
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
  return (...operations: OperatorFunction<any, any>[]): Observable<any> => {
    return pipe.apply(context, operations.map((op: DebugOperator) => {
      return (source: Observable<any>) => {
        const res = op(source)

        if (!op.__debug) {
          throw new Error('operator should have __debug property')
        }
        const debug = assignMeta(res, op.__debug.name)

        debug.parent.push(source, op.__debug.parent ? op.__debug.parent : []) // TODO condition

        return res
      }
    }))
  }
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

function isDebugLike(object: DebugObject) {
  return '__debug' in object
}
