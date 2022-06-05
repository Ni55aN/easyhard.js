/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { getUID } from 'easyhard-common'
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

export function decorateOperator<Args extends never[], Return extends DebugObject, Operator extends (...args: Args) => Return>(operator: Operator): Operator {
  return <Operator>((...args) => {
    const processedArgs = <Args>args.map((arg: any) => {
      if (typeof arg == 'function') {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        return (...params: any[]) => {
          const result = arg(...params)
          if (result instanceof Observable) {
            debug.parent.push(result)
          }
          return result
        }
      }
      return arg
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
    const processedArgs = args.map((arg: any) => {
      if (typeof arg == 'function') {
        return (...params: any[]) => {
          const result = arg(...params)
          if (result instanceof Observable) {
            debug.parent.push(result)
          }
          return result
        }
      }
      return arg
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

function isDebugLike(object: DebugObject) {
  return '__debug' in object
}
